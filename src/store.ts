import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { Referee } from './rules';

export const Reply = z.object({ attemptId: z.string().uuid(), moveUci: z.string().regex(/^[a-h][1-8][a-h][1-8][qrbn]?$/) }).strict();
export type Lease = { id: string; owner: string; fence: number; version: number; attemptId: string };

export class Store {
  constructor(readonly pool: pg.Pool) {}
  async init() {
    await this.pool.query(`
      SELECT pg_advisory_xact_lock(664421);
      CREATE TABLE IF NOT EXISTS validation_matches (
        id uuid PRIMARY KEY, initial_fen text NOT NULL, moves jsonb NOT NULL DEFAULT '[]',
        version integer NOT NULL DEFAULT 0, fence integer NOT NULL DEFAULT 0,
        owner text, lease_until timestamptz, attempt_id uuid,
        status text NOT NULL DEFAULT 'ongoing', result jsonb
      );
      CREATE TABLE IF NOT EXISTS validation_events (
        match_id uuid REFERENCES validation_matches(id), seq integer NOT NULL,
        payload jsonb NOT NULL, PRIMARY KEY(match_id, seq)
      );
      CREATE TABLE IF NOT EXISTS validation_accounts (id uuid PRIMARY KEY, available bigint NOT NULL CHECK(available >= 0));
      CREATE TABLE IF NOT EXISTS validation_reservations (
        id uuid PRIMARY KEY, account_id uuid REFERENCES validation_accounts(id),
        amount bigint NOT NULL CHECK(amount > 0)
      );`);
  }
  async create(initialFen: string) {
    const result = new Referee(initialFen).outcome();
    const id = randomUUID();
    await this.pool.query('INSERT INTO validation_matches(id,initial_fen,status,result) VALUES($1,$2,$3,$4)', [id, initialFen, result.kind, result]);
    return id;
  }
  async claim(id: string, owner: string, leaseMs = 30_000): Promise<Lease | null> {
    if (!Number.isSafeInteger(leaseMs) || leaseMs <= 0) throw new Error('Invalid lease');
    const attemptId = randomUUID();
    const { rows } = await this.pool.query(`UPDATE validation_matches
      SET owner=$2, fence=fence+1, lease_until=clock_timestamp()+$3*interval '1 millisecond', attempt_id=$4
      WHERE id=$1 AND status='ongoing' AND (lease_until IS NULL OR lease_until<=clock_timestamp())
      RETURNING fence,version`, [id, owner, leaseMs, attemptId]);
    return rows[0] ? { id, owner, fence: rows[0].fence, version: rows[0].version, attemptId } : null;
  }
  async commitMove(lease: Lease, raw: unknown, timing: { elapsedMs: number; limitMs: number }) {
    const reply = Reply.parse(raw);
    if (reply.attemptId !== lease.attemptId) throw new Error('Wrong attempt');
    if (!Number.isFinite(timing.elapsedMs) || !Number.isFinite(timing.limitMs) || timing.elapsedMs < 0 || timing.limitMs <= 0 || timing.elapsedMs >= timing.limitMs) throw new Error('Late response');
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(`SELECT * FROM validation_matches
        WHERE id=$1 AND version=$2 AND fence=$3 AND owner=$4 AND attempt_id=$5
        AND lease_until>clock_timestamp() AND status='ongoing' FOR UPDATE`,
        [lease.id, lease.version, lease.fence, lease.owner, lease.attemptId]);
      const match = rows[0];
      if (!match) throw new Error('Stale or expired lease');
      const referee = new Referee(match.initial_fen, match.moves);
      const result = referee.play(reply.moveUci);
      const seq = match.version + 1;
      const event = { seq, moveUci: reply.moveUci, fen: referee.chess.fen(), result, rankEligible: false };
      await client.query(`INSERT INTO validation_events(match_id,seq,payload) VALUES($1,$2,$3)`, [lease.id, seq, event]);
      // Recheck expiry after validation; transaction rollback also removes the event on failure.
      const update = await client.query(`UPDATE validation_matches SET moves=$2,version=$3,status=$4,result=$5,owner=NULL,lease_until=NULL,attempt_id=NULL
        WHERE id=$1 AND lease_until>clock_timestamp() RETURNING id`,
        [lease.id, JSON.stringify(referee.moves), seq, result.kind, result]);
      if (update.rowCount !== 1) throw new Error('Lease expired during validation');
      await client.query('COMMIT');
      return event;
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  async snapshot(id: string) {
    const { rows } = await this.pool.query('SELECT initial_fen,moves,version AS cursor,status,result FROM validation_matches WHERE id=$1', [id]);
    if (!rows[0]) throw new Error('Unknown match');
    return rows[0] as { initial_fen: string; moves: string[]; cursor: number; status: string; result: unknown };
  }
  async eventsAfter(id: string, cursor: number) {
    if (!Number.isSafeInteger(cursor) || cursor < 0) throw new Error('Invalid cursor');
    if (cursor > (await this.snapshot(id)).cursor) throw new RangeError('Cursor ahead of recorded game');
    return (await this.pool.query('SELECT payload FROM validation_events WHERE match_id=$1 AND seq>$2 ORDER BY seq', [id, cursor])).rows.map(row => row.payload);
  }
  async reserve(accountId: string, pairId: string, amount: number) {
    if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('Invalid amount');
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const account = await client.query('SELECT id FROM validation_accounts WHERE id=$1 FOR UPDATE', [accountId]);
      if (!account.rowCount) { await client.query('ROLLBACK'); return false; }
      const existing = await client.query('SELECT account_id,amount FROM validation_reservations WHERE id=$1', [pairId]);
      if (existing.rowCount) {
        if (existing.rows[0].account_id !== accountId || Number(existing.rows[0].amount) !== amount) throw new Error('Conflicting reservation');
        await client.query('COMMIT'); return true;
      }
      const updated = await client.query('UPDATE validation_accounts SET available=available-$2 WHERE id=$1 AND available >= $2 RETURNING id', [accountId, amount]);
      if (!updated.rowCount) { await client.query('ROLLBACK'); return false; }
      await client.query('INSERT INTO validation_reservations(id,account_id,amount) VALUES($1,$2,$3)', [pairId, accountId, amount]);
      await client.query('COMMIT'); return true;
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
}
