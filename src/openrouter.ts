import { z } from 'zod';
export const MATCH_PROTOCOL = 'legal-choice-v2';
export const RESERVE_MICROS = 50_000;
export const MOVE_TIMEOUT_MS = 45_000;
const Reply = z.object({ moveUci: z.string().regex(/^[a-h][1-8][a-h][1-8][qrbn]?$/) }).strict();
export function parseMove(content: string, legalMoves: string[]) {
  if (Buffer.byteLength(content) > 1024) throw new Error('Oversized move response');
  let moveUci: string;
  try { ({moveUci} = Reply.parse(JSON.parse(content))); } catch { throw new Error('Model returned malformed move JSON; expected UCI coordinates'); }
  if (!legalMoves.includes(moveUci)) throw new Error('Model returned an illegal move');
  return moveUci;
}
export async function openRouterMove(model: string, turn: { fen: string; legalMoves: string[]; historyUci: string[] }, options: { apiKey: string; fetch?: typeof fetch; timeoutMs?: number; systemPrompt?:string }) {
  if(options.systemPrompt && options.systemPrompt.length>800)throw Error('Prompt too long');
  const messages = [
    { role: 'system', content: (options.systemPrompt?options.systemPrompt+'\n':'')+'You are playing chess. Choose the strongest legal move. Return only JSON with exactly one key: "moveUci". Use UCI coordinates such as e2e4 or a7a8q, never SAN. Choose exactly one entry from legalMoves. No markdown.' },
    { role: 'user', content: JSON.stringify(turn) },
  ];
  const body = JSON.stringify({model, messages, max_tokens:1024, stream:false,
    ...(model.startsWith('google/gemini-') ? {reasoning:{enabled:false}} : {}),
    response_format:{type:'json_schema',json_schema:{name:'chess_move',strict:true,schema:{type:'object',properties:{moveUci:{type:'string',enum:turn.legalMoves}},required:['moveUci'],additionalProperties:false}}},
    provider:{allow_fallbacks:false,require_parameters:true,max_price:{prompt:2,completion:10,request:0}},
  });
  // At these token-price ceilings, 12 KiB input plus 1,024 output tokens fits the $0.05 reservation.
  if (!options.apiKey || Buffer.byteLength(body)>12000 || !turn.legalMoves.length || turn.legalMoves.length>256 || turn.historyUci.length>240 || turn.fen.length>128 || [...turn.legalMoves,...turn.historyUci].some(m=>!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(m))) throw new Error('Invalid or oversized turn');
  const started = performance.now(), timeoutMs = options.timeoutMs ?? MOVE_TIMEOUT_MS;
  if (!Number.isInteger(timeoutMs) || timeoutMs<=0 || timeoutMs>2**31-1) throw new Error('Invalid deadline');
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), timeoutMs);
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  try {
    const response = await (options.fetch ?? fetch)('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST', signal: controller.signal,
      headers: { Authorization: `Bearer ${options.apiKey}`, 'Content-Type': 'application/json', 'X-OpenRouter-Title': 'Local AI Chess Arena' },
      body,
    });
    reader = response.body?.getReader();
    const chunks: Uint8Array[] = []; let size = 0;
    while (reader) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > 65536) throw new Error('Provider response exceeds 64 KiB'); chunks.push(value); }
    const latencyMs = performance.now() - started;
    if (controller.signal.aborted || latencyMs >= timeoutMs) throw new Error('Provider response missed deadline');
    if (!response.ok) throw new Error(`OpenRouter HTTP ${response.status}`);
    const reply = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (reply.error) throw new Error('OpenRouter returned a provider error');
    const cost = reply.usage?.cost;
    const costMicros = typeof cost === 'number' && Number.isFinite(cost) && cost >= 0 ? Math.ceil(cost * 1e6) : null;
    return { content: reply.choices?.[0]?.message?.content, finishReason: reply.choices?.[0]?.finish_reason,
      requestId: typeof reply.id === 'string' ? reply.id : null, model: reply.model ?? model, latencyMs,
      inputTokens: reply.usage?.prompt_tokens ?? null, outputTokens: reply.usage?.completion_tokens ?? null, costMicros };
  } finally { clearTimeout(timer); controller.abort(); await reader?.cancel().catch(() => {}); reader?.releaseLock(); }
}
