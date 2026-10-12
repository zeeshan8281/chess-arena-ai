import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { DEFAULT_POSITION } from 'chess.js';
import { Store } from '../src/store';

const connectionString = process.env.ARENA_TEST_DATABASE_URL;
if (!connectionString) throw new Error('ARENA_TEST_DATABASE_URL required: tests must exercise real PostgreSQL');
if (new URL(connectionString).pathname !== '/arena_validation') throw new Error('Use a dedicated arena_validation database');
const pool = new pg.Pool({ connectionString });
const store = new Store(pool);
test.before(async () => store.init());
test.after(async () => pool.end());
const timing = { elapsedMs: 100, limitMs: 1000 };

test('two workers cannot both claim a live turn', async () => {
  const id = await store.create(DEFAULT_POSITION);
  const claims = await Promise.all([store.claim(id,'a'), store.claim(id,'b')]);
  assert.equal(claims.filter(Boolean).length, 1);
});
test('duplicate concurrent responses create exactly one move and event', async () => {
  const id = await store.create(DEFAULT_POSITION); const lease = (await store.claim(id,'a'))!;
  const reply = { attemptId: lease.attemptId, moveUci:'e2e4' };
  const result = await Promise.allSettled([store.commitMove(lease,reply,timing), store.commitMove(lease,reply,timing)]);
  assert.equal(result.filter(r=>r.status==='fulfilled').length,1);
  assert.equal((await store.snapshot(id)).cursor,1);
  assert.equal((await store.eventsAfter(id,0)).length,1);
});
test('expired worker cannot commit without a successor; fence rejects old generation', async () => {
  const id = await store.create(DEFAULT_POSITION); const old = (await store.claim(id,'old'))!;
  await pool.query("UPDATE validation_matches SET lease_until=clock_timestamp()-interval '1 second' WHERE id=$1",[id]);
  await assert.rejects(store.commitMove(old,{attemptId:old.attemptId,moveUci:'e2e4'},timing), /expired/);
  const newer = (await store.claim(id,'new'))!;
  assert.ok(newer.fence > old.fence);
  await assert.rejects(store.commitMove(old,{attemptId:old.attemptId,moveUci:'e2e4'},timing), /Stale/);
  await store.commitMove(newer,{attemptId:newer.attemptId,moveUci:'d2d4'},timing);
  assert.deepEqual((await store.snapshot(id)).moves,['d2d4']);
});
test('illegal response rolls back event and position; attempt mismatch cannot mutate', async () => {
  const id=await store.create(DEFAULT_POSITION); const lease=(await store.claim(id,'a'))!;
  await assert.rejects(store.commitMove(lease,{attemptId:lease.attemptId,moveUci:'e2e5'},timing));
  await assert.rejects(store.commitMove(lease,{attemptId:randomUUID(),moveUci:'e2e4'},timing),/Wrong attempt/);
  assert.equal((await store.snapshot(id)).cursor,0);
  assert.deepEqual(await store.eventsAfter(id,0),[]);
});
test('deadline equality is rejected; observed on-time response commits', async () => {
  const id=await store.create(DEFAULT_POSITION); const lease=(await store.claim(id,'a'))!;
  const reply={attemptId:lease.attemptId,moveUci:'e2e4'};
  await assert.rejects(store.commitMove(lease,reply,{elapsedMs:1000,limitMs:1000}),/Late/);
  await store.commitMove(lease,reply,{elapsedMs:999,limitMs:1000});
});
test('fresh connection reconstructs committed state and replay catches snapshot gap', async () => {
  const id=await store.create(DEFAULT_POSITION); const snapshot=await store.snapshot(id);
  const lease=(await store.claim(id,'a'))!;
  await store.commitMove(lease,{attemptId:lease.attemptId,moveUci:'e2e4'},timing);
  const secondPool=new pg.Pool({connectionString});
  try {
    const fresh=new Store(secondPool);
    assert.deepEqual((await fresh.snapshot(id)).moves,['e2e4']);
    const tail=await fresh.eventsAfter(id,snapshot.cursor);
    assert.equal(tail.length,1); assert.equal(tail[0].seq,1);
    assert.deepEqual(await fresh.eventsAfter(id,tail[0].seq),[]);
  } finally { await secondPool.end(); }
});
test('concurrent whole-pair reservations cannot overspend; retry is idempotent', async () => {
  const account=randomUUID(); await pool.query('INSERT INTO validation_accounts VALUES($1,$2)',[account,100]);
  const pairs=[randomUUID(),randomUUID()];
  const results=await Promise.all(pairs.map(id=>store.reserve(account,id,80)));
  assert.equal(results.filter(Boolean).length,1);
  const winning=pairs[results.findIndex(Boolean)];
  assert.equal(await store.reserve(account,winning,80),true);
  assert.equal(Number((await pool.query('SELECT available FROM validation_accounts WHERE id=$1',[account])).rows[0].available),20);
  await assert.rejects(store.reserve(account,winning,70),/Conflicting/);
});

test('connection death before commit rolls back move and event together', async () => {
  const id=await store.create(DEFAULT_POSITION);
  const client=await pool.connect();
  await client.query('BEGIN');
  await client.query('UPDATE validation_matches SET version=1 WHERE id=$1',[id]);
  await client.query('INSERT INTO validation_events(match_id,seq,payload) VALUES($1,1,$2)',[id,{moveUci:'e2e4'}]);
  client.release(true);
  assert.equal((await store.snapshot(id)).cursor,0);
  assert.deepEqual(await store.eventsAfter(id,0),[]);
});

test('simultaneous retry of the same pair reserves once and succeeds idempotently', async () => {
  const account=randomUUID(), pair=randomUUID();
  await pool.query('INSERT INTO validation_accounts VALUES($1,$2)',[account,100]);
  assert.deepEqual(await Promise.all([store.reserve(account,pair,80),store.reserve(account,pair,80)]),[true,true]);
  assert.equal(Number((await pool.query('SELECT available FROM validation_accounts WHERE id=$1',[account])).rows[0].available),20);
  assert.equal(Number((await pool.query('SELECT count(*) FROM validation_reservations WHERE id=$1',[pair])).rows[0].count),1);
});

test('terminal starting position cannot be dispatched as an ongoing game', async () => {
  const id=await store.create('8/8/8/8/8/8/K7/7k w - - 0 1');
  assert.equal((await store.snapshot(id)).status,'draw');
  assert.equal(await store.claim(id,'worker'),null);
});

test('a future replay cursor is rejected instead of silently completing', async () => {
  const id=await store.create(DEFAULT_POSITION);
  await assert.rejects(store.eventsAfter(id,1),/Cursor ahead/);
});
