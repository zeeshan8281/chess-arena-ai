import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const uci = /^[a-h][1-8][a-h][1-8][qrbn]?$/;
const moveSchema = z.object({ moveUci: z.string().regex(uci) }).strict();

// Caller must reserve spend and supply canonical server-generated legal moves before invocation.
export async function fetchMove(
  turn: { fen: string; legalMoves: string[]; historyUci?: string[] },
  options: { apiKey: string; timeoutMs: number; fetch?: typeof fetch },
) {
  if (!options.apiKey || !Number.isInteger(options.timeoutMs) || options.timeoutMs <= 0 || options.timeoutMs > 2 ** 31 - 1002) {
    throw new Error('API key and bounded positive integer timeout are required');
  }
  const historyUci = turn.historyUci ?? [];
  if (!turn.fen || turn.fen.length > 128 || !turn.legalMoves.length || turn.legalMoves.length > 256 || historyUci.length > 240 ||
      [...turn.legalMoves, ...historyUci].some(move => !uci.test(move))) {
    throw new Error('Invalid or oversized turn input');
  }
  let latencyMs = 0;
  const boundedFetch: typeof fetch = async (input, init) => {
    const started = performance.now();
    const deadline = new AbortController();
    const timer = setTimeout(() => deadline.abort(), options.timeoutMs);
    const signal = init?.signal ? AbortSignal.any([init.signal, deadline.signal]) : deadline.signal;
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    try {
      const raw = await (options.fetch ?? fetch)(input, { ...init, signal });
      reader = raw.body?.getReader();
      const chunks: Uint8Array[] = [];
      let bytes = 0;
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 64 * 1024) throw new Error('Provider HTTP response exceeds 64 KiB');
        chunks.push(value);
      }
      // Receipt means complete bytes observed here, not inferred kernel arrival or SDK parse completion.
      latencyMs = performance.now() - started;
      if (signal.aborted || latencyMs >= options.timeoutMs) throw new Error('Provider response missed deadline');
      return new Response(bytes ? Buffer.concat(chunks) : null, { status: raw.status, statusText: raw.statusText, headers: raw.headers });
    } catch (error) {
      deadline.abort();
      await reader?.cancel().catch(() => {});
      throw error;
    } finally {
      clearTimeout(timer);
      reader?.releaseLock();
    }
  };
  // SDK timeout is a later transport fallback; only boundedFetch's single dispatch clock admits responses.
  const client = new Anthropic({ apiKey: options.apiKey, maxRetries: 0, timeout: options.timeoutMs + 1000, fetch: boundedFetch });
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    thinking: { type: 'enabled', budget_tokens: 1024 },
    system: 'Choose one legal chess move. Return only JSON with exactly one key: moveUci. Do not use markdown.',
    messages: [{ role: 'user', content: JSON.stringify({ ...turn, historyUci }) }],
  }, { maxRetries: 0 });
  if (response.stop_reason !== 'end_turn') throw new Error('Provider did not finish a move');
  const text = response.content.filter(block => block.type === 'text').map(block => block.text).join('');
  if (Buffer.byteLength(text, 'utf8') > 1024) throw new Error('Move response exceeds 1 KiB');
  const { moveUci } = moveSchema.parse(JSON.parse(text));
  if (!turn.legalMoves.includes(moveUci)) throw new Error('Provider returned an illegal move');
  return {
    moveUci,
    model: response.model,
    requestId: response._request_id ?? null,
    latencyMs,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
      cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
    },
  };
}
