import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import test from 'node:test';
import { fetchMove } from '../src/provider.js';

const turn = { fen: 'start-position-fixture', legalMoves: ['e2e4', 'd2d4'] };
const key = 'local-fixture-secret-not-real';
const response = (text: string) => ({
  id: 'msg_fixture', type: 'message', role: 'assistant', model: 'claude-haiku-4-5-20251001',
  content: [{ type: 'text', text }], stop_reason: 'end_turn', stop_sequence: null,
  usage: { input_tokens: 100, output_tokens: 12, cache_creation_input_tokens: 4, cache_read_input_tokens: 8 },
});

// Only local HTTP fixtures run here; these are not live provider compatibility tests.
async function fixture(body: unknown, status = 200, delayMs = 0) {
  const requests: { url: string; body: Record<string, unknown> }[] = [];
  const timers: ReturnType<typeof setTimeout>[] = [];
  const server = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    requests.push({ url: req.url!, body: JSON.parse(Buffer.concat(chunks).toString()) });
    timers.push(setTimeout(() => {
      res.writeHead(status, { 'content-type': 'application/json', 'request-id': 'req_fixture' });
      res.end(JSON.stringify(body));
    }, delayMs));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert(address && typeof address !== 'string');
  const localFetch: typeof fetch = (input, init) => {
    const original = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    return fetch(`http://127.0.0.1:${address.port}${original.pathname}`, init);
  };
  return {
    requests,
    options: { apiKey: key, timeoutMs: 1500, fetch: localFetch },
    close: async () => {
      timers.forEach(clearTimeout);
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    },
  };
}

test('real SDK serializes one bounded move request and normalizes fixture usage without secrets', async () => {
  const f = await fixture(response('{"moveUci":"e2e4"}'));
  try {
    const result = await fetchMove(turn, f.options);
    assert.equal(result.moveUci, 'e2e4');
    assert.equal(result.requestId, 'req_fixture');
    assert.deepEqual(result.usage, { inputTokens: 100, outputTokens: 12, cacheWriteTokens: 4, cacheReadTokens: 8 });
    assert(result.latencyMs >= 0 && Number.isFinite(result.latencyMs));
    assert(!JSON.stringify(result).includes(key));
    assert.equal(f.requests.length, 1);
    assert.equal(f.requests[0].url, '/v1/messages');
    assert.equal(f.requests[0].body.max_tokens, 2048);
    assert.deepEqual(f.requests[0].body.thinking, { type: 'enabled', budget_tokens: 1024 });
    assert.equal(f.requests[0].body.model, 'claude-haiku-4-5-20251001');
    assert.equal(f.requests[0].body.tools, undefined);
  } finally { await f.close(); }
});

test('500 response does not retry', async () => {
  const f = await fixture({ type: 'error', error: { type: 'api_error', message: 'fixture error' } }, 500);
  try {
    await assert.rejects(fetchMove(turn, f.options));
    assert.equal(f.requests.length, 1);
  } finally { await f.close(); }
});

for (const [name, text] of [['malformed', 'not json'], ['illegal', '{"moveUci":"a2a4"}'], ['extra field', '{"moveUci":"e2e4","secret":"x"}'], ['oversized', ' '.repeat(1025)]]) {
  test(`rejects ${name} fixture response`, async () => {
    const f = await fixture(response(text));
    try { await assert.rejects(fetchMove(turn, f.options)); }
    finally { await f.close(); }
  });
}

test('deadline aborts delayed fixture without retrying', async () => {
  const f = await fixture(response('{"moveUci":"e2e4"}'), 200, 1000);
  try {
    const started = performance.now();
    await assert.rejects(fetchMove(turn, { ...f.options, timeoutMs: 80 }));
    assert(performance.now() - started < 900);
    assert.equal(f.requests.length, 1);
  } finally { await f.close(); }
});

for (const status of [200, 500]) {
  test(`bounds full HTTP body including non-text fields at status ${status}`, async () => {
    const f = await fixture({ ...response('{"moveUci":"e2e4"}'), hidden: 'x'.repeat(65536) }, status);
    try {
      await assert.rejects(fetchMove(turn, f.options));
      assert.equal(f.requests.length, 1);
    } finally { await f.close(); }
  });
}

for (const observed of [79, 80, 81]) {
  test(`monotonic completion at ${observed} ms uses strict 80 ms boundary even before timer callback`, async t => {
    let now = 0;
    t.mock.method(performance, 'now', () => now);
    const options = { apiKey: key, timeoutMs: 80, fetch: (async () => {
      now = observed;
      return new Response(JSON.stringify(response('{"moveUci":"e2e4"}')), { headers: { 'content-type': 'application/json' } });
    }) as typeof fetch };
    if (observed < 80) {
      const result = await fetchMove(turn, options);
      assert.equal(result.latencyMs, observed);
    } else {
      await assert.rejects(fetchMove(turn, options));
    }
  });
}

test('history is included in SDK prompt, defaulted, and bounded before dispatch', async () => {
  const f = await fixture(response('{"moveUci":"e2e4"}'));
  try {
    await fetchMove({ ...turn, historyUci: ['e2e4', 'e7e5'] }, f.options);
    const messages = f.requests[0].body.messages as { content: string }[];
    assert.deepEqual(JSON.parse(messages[0].content).historyUci, ['e2e4', 'e7e5']);
    await assert.rejects(fetchMove({ ...turn, historyUci: Array(241).fill('e2e4') }, f.options));
    await assert.rejects(fetchMove({ ...turn, historyUci: ['bad'] }, f.options));
    assert.equal(f.requests.length, 1);
  } finally { await f.close(); }
});
