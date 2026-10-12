import pg from 'pg';
import assert from 'node:assert/strict';
import demo from '../data/demo.json';
import { Referee } from './rules';
import { Store } from './store';
const source = process.env.ARENA_TEST_DATABASE_URL;
const restored = process.env.ARENA_RESTORE_DATABASE_URL;
if (!source || !restored || new URL(source).pathname !== '/arena_validation' || new URL(restored).pathname !== '/arena_validation_restore_final') throw new Error('Dedicated source and restored validation databases required');
const a = new pg.Pool({ connectionString: source }), b = new pg.Pool({ connectionString: restored });
try {
  const original = new Store(a), backup = new Store(b);
  const current = await original.snapshot(demo.id), recovered = await backup.snapshot(demo.id);
  assert.deepEqual(current, recovered);
  assert.deepEqual(await original.eventsAfter(demo.id, 0), await backup.eventsAfter(demo.id, 0));
  assert.equal(current.cursor, 7);
  const replay = new Referee(current.initial_fen, current.moves);
  assert.equal(replay.pgn(), demo.pgn);
  assert.deepEqual(replay.outcome(), { kind: 'win', reason: 'checkmate', winner: 'w' });
  for (const table of ['validation_matches', 'validation_events', 'validation_accounts', 'validation_reservations']) {
    const order = table === 'validation_events' ? 'match_id,seq' : 'id';
    assert.deepEqual((await a.query(`SELECT * FROM ${table} ORDER BY ${order}`)).rows, (await b.query(`SELECT * FROM ${table} ORDER BY ${order}`)).rows);
  }
  console.log(JSON.stringify({ matchId: demo.id, postRestartReplay: 'pass', restoredSnapshot: 'exact-match', restoredEvents: 'exact-match', pgn: 'exact-match', allFourTables: 'exact-match including reservations and balances' }));
} finally { await a.end(); await b.end(); }
