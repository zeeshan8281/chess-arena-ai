import { z } from 'zod';
export const RESERVE_MICROS = 50_000;
export const MOVE_TIMEOUT_MS = 45_000;
const Reply = z.object({ moveUci: z.string().regex(/^[a-h][1-8][a-h][1-8][qrbn]?$/) }).strict();
export function parseMove(content: string, legalMoves: string[]) {
  if (Buffer.byteLength(content) > 1024) throw new Error('Oversized move response');
  const { moveUci } = Reply.parse(JSON.parse(content));
  if (!legalMoves.includes(moveUci)) throw new Error('Model returned an illegal move');
  return moveUci;
}
export async function openRouterMove(model: string, turn: { fen: string; legalMoves: string[]; historyUci: string[] }, options: { apiKey: string; fetch?: typeof fetch; timeoutMs?: number }) {
  const messages = [
    { role: 'system', content: 'You are playing chess. Choose the strongest legal move. Return only JSON with exactly one key: "moveUci". No markdown. The legal moves are authoritative.' },
    { role: 'user', content: JSON.stringify(turn) },
  ];
  if (!options.apiKey || Buffer.byteLength(JSON.stringify(messages)) > 8000 || !turn.legalMoves.length) throw new Error('Invalid or oversized turn');
  const started = performance.now(), timeoutMs = options.timeoutMs ?? MOVE_TIMEOUT_MS;
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), timeoutMs);
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  try {
    const response = await (options.fetch ?? fetch)('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST', signal: controller.signal,
      headers: { Authorization: `Bearer ${options.apiKey}`, 'Content-Type': 'application/json', 'X-OpenRouter-Title': 'Local AI Chess Arena' },
      body: JSON.stringify({ model, messages, max_tokens: 1024, stream: false,
        ...(model.startsWith('google/gemini-') ? { reasoning: { enabled: false } } : {}), response_format: { type: 'json_object' },
        provider: { allow_fallbacks: false, require_parameters: true, max_price: { prompt: 2, completion: 10, request: 0 } } }),
    });
    reader = response.body?.getReader();
    const chunks: Uint8Array[] = []; let size = 0;
    while (reader) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > 65536) throw new Error('Provider response exceeds 64 KiB'); chunks.push(value); }
    const latencyMs = performance.now() - started;
    if (controller.signal.aborted || latencyMs >= timeoutMs) throw new Error('Provider response missed deadline');
    if (!response.ok) throw new Error(`OpenRouter HTTP ${response.status}`);
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (body.error) throw new Error('OpenRouter returned a provider error');
    const cost = body.usage?.cost;
    const costMicros = typeof cost === 'number' && Number.isFinite(cost) && cost >= 0 ? Math.ceil(cost * 1e6) : null;
    return { content: body.choices?.[0]?.message?.content, finishReason: body.choices?.[0]?.finish_reason,
      requestId: typeof body.id === 'string' ? body.id : null, model: body.model ?? model, latencyMs,
      inputTokens: body.usage?.prompt_tokens ?? null, outputTokens: body.usage?.completion_tokens ?? null, costMicros };
  } finally { clearTimeout(timer); controller.abort(); await reader?.cancel().catch(() => {}); reader?.releaseLock(); }
}
