import { randomUUID } from 'node:crypto';
import { DEFAULT_POSITION } from 'chess.js';
import { Store, type Lease } from './store';
import { Referee, type Outcome } from './rules';
import { isAgent, agentName } from './agents';
import { RESERVE_MICROS } from './openrouter';

export const BUDGET_ID = 'b893ff67-f32a-4b80-a821-9e752d895b3a';
export const BUDGET_MICROS = Math.floor(Number(process.env.ARENA_BUDGET_USD ?? '5') * 1e6);
if (!Number.isSafeInteger(BUDGET_MICROS) || BUDGET_MICROS < 0 || BUDGET_MICROS > 5_000_000) throw new Error('Arena budget must be between $0 and $5');
export class Arena extends Store {
  async init() {
    await super.init();
    await this.pool.query(`
      SELECT pg_advisory_xact_lock(664421);
      CREATE TABLE IF NOT EXISTS arena_games (
        match_id uuid PRIMARY KEY REFERENCES validation_matches(id), pair_id uuid NOT NULL,
        white text NOT NULL, black text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
        max_plies integer NOT NULL DEFAULT 160
      );
      CREATE TABLE IF NOT EXISTS arena_attempts (
        id uuid PRIMARY KEY, match_id uuid NOT NULL REFERENCES arena_games(match_id),
        version integer NOT NULL, agent text NOT NULL, paid boolean NOT NULL,
        state text NOT NULL DEFAULT 'dispatched', created_at timestamptz NOT NULL DEFAULT now(),
        cost_micros bigint, latency_ms double precision, input_tokens integer, output_tokens integer,
        request_id text, error text, UNIQUE(match_id,version)
      );
      CREATE TABLE IF NOT EXISTS arena_worker (id integer PRIMARY KEY CHECK(id=1), heartbeat timestamptz NOT NULL);
      INSERT INTO validation_accounts(id,available) VALUES('${BUDGET_ID}',${BUDGET_MICROS}) ON CONFLICT DO NOTHING;
    `);
  }
  async createGames(white: string, black: string, paired: boolean) {
    if (!isAgent(white) || !isAgent(black) || white === black) throw new Error('Choose two different available agents');
    const client = await this.pool.connect(), pairId = randomUUID(), ids: string[] = [];
    try {
      await client.query('BEGIN');
      // Serialize queue admission so repeated clicks cannot create an unbounded paid queue.
      await client.query('SELECT id FROM validation_accounts WHERE id=$1 FOR UPDATE', [BUDGET_ID]);
      const active = await client.query("SELECT count(*)::int AS n FROM arena_games g JOIN validation_matches m ON m.id=g.match_id WHERE m.status='ongoing'");
      if (active.rows[0].n + (paired ? 2 : 1) > 4) throw new Error('Queue is full. Finish or cancel an active match first.');
      for (const [w,b] of paired ? [[white,black],[black,white]] : [[white,black]]) {
        const id = randomUUID(); ids.push(id);
        await client.query('INSERT INTO validation_matches(id,initial_fen,result) VALUES($1,$2,$3)', [id, DEFAULT_POSITION, new Referee().outcome()]);
        await client.query('INSERT INTO arena_games(match_id,pair_id,white,black) VALUES($1,$2,$3,$4)', [id,pairId,w,b]);
      }
      await client.query('COMMIT'); return ids;
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }
  async finish(id: string, result: Outcome, lease?: Lease) {
    if (result.kind === 'ongoing') throw new Error('Terminal result required');
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query("SELECT * FROM validation_matches WHERE id=$1 AND status='ongoing' FOR UPDATE",[id]);
      const m = rows[0];
      if (!m) { await client.query('ROLLBACK'); return false; }
      if (lease && (m.fence !== lease.fence || m.owner !== lease.owner || m.attempt_id !== lease.attemptId || m.version !== lease.version || new Date(m.lease_until).getTime() <= Date.now())) throw new Error('Stale or expired lease');
      const referee = new Referee(m.initial_fen,m.moves), seq = m.version + 1;
      await client.query('INSERT INTO validation_events(match_id,seq,payload) VALUES($1,$2,$3)',[id,seq,{seq,fen:referee.chess.fen(),result,rankEligible:false}]);
      await client.query('UPDATE validation_matches SET status=$2,result=$3,version=$4,fence=fence+1,owner=NULL,lease_until=NULL,attempt_id=NULL WHERE id=$1',[id,result.kind,result,seq]);
      await client.query('COMMIT'); return true;
    } catch(e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }
  async beginAttempt(lease: Lease, agent: string, paid: boolean) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const current = await client.query(`SELECT id FROM validation_matches WHERE id=$1 AND fence=$2 AND version=$3 AND attempt_id=$4 AND status='ongoing' AND lease_until>clock_timestamp() FOR UPDATE`,[lease.id,lease.fence,lease.version,lease.attemptId]);
      if (!current.rowCount) throw new Error('Stale attempt');
      const previous = await client.query('SELECT id FROM arena_attempts WHERE match_id=$1 AND version=$2',[lease.id,lease.version]);
      if (previous.rowCount) { await client.query('ROLLBACK'); return 'interrupted' as const; }
      if (paid) {
        const reserved = await client.query('UPDATE validation_accounts SET available=available-$2 WHERE id=$1 AND available>=$2 RETURNING id',[BUDGET_ID,RESERVE_MICROS]);
        if (!reserved.rowCount) { await client.query('ROLLBACK'); return 'budget' as const; }
        await client.query('INSERT INTO validation_reservations(id,account_id,amount) VALUES($1,$2,$3)',[lease.attemptId,BUDGET_ID,RESERVE_MICROS]);
      }
      await client.query('INSERT INTO arena_attempts(id,match_id,version,agent,paid) VALUES($1,$2,$3,$4,$5)',[lease.attemptId,lease.id,lease.version,agent,paid]);
      await client.query('COMMIT'); return 'ready' as const;
    } catch(e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }
  async recordAttempt(id: string, info: { costMicros: number | null; latencyMs: number; inputTokens?: number | null; outputTokens?: number | null; requestId?: string | null; error?: string }) {
    if (info.costMicros !== null && (!Number.isSafeInteger(info.costMicros) || info.costMicros < 0)) throw new Error('Invalid provider cost');
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query('SELECT * FROM arena_attempts WHERE id=$1 FOR UPDATE',[id]);
      if (!rows[0] || rows[0].state !== 'dispatched') { await client.query('ROLLBACK'); return; }
      if (rows[0].paid && info.costMicros !== null) {
        // Unknown billing keeps its whole reservation; successful accounting releases only the unused ceiling.
        await client.query('UPDATE validation_accounts SET available=CASE WHEN $3 THEN 0 ELSE GREATEST(0,available+$2) END WHERE id=$1',[BUDGET_ID,RESERVE_MICROS-info.costMicros,info.costMicros>RESERVE_MICROS]);
        await client.query('DELETE FROM validation_reservations WHERE id=$1',[id]);
      }
      await client.query(`UPDATE arena_attempts SET state=$2,cost_micros=$3,latency_ms=$4,input_tokens=$5,output_tokens=$6,request_id=$7,error=$8 WHERE id=$1`,[id,info.error?'failed':'received',info.costMicros,info.latencyMs,info.inputTokens??null,info.outputTokens??null,info.requestId??null,info.error??null]);
      await client.query('COMMIT');
    } catch(e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }
  async list() {
    const games = (await this.pool.query(`SELECT g.*,m.status,m.result,jsonb_array_length(m.moves) AS plies,
      COALESCE((SELECT sum(cost_micros) FROM arena_attempts a WHERE a.match_id=g.match_id),0)::float8 AS cost_micros
      FROM arena_games g JOIN validation_matches m ON m.id=g.match_id ORDER BY g.created_at DESC LIMIT 100`)).rows;
    const budget = (await this.pool.query(`SELECT available::float8,
      (SELECT COALESCE(sum(cost_micros),0)::float8 FROM arena_attempts WHERE paid) AS spent,
      (SELECT COALESCE(sum(amount),0)::float8 FROM validation_reservations WHERE account_id=$1) AS reserved
      FROM validation_accounts WHERE id=$1`,[BUDGET_ID])).rows[0];
    const worker = (await this.pool.query("SELECT heartbeat,heartbeat>now()-interval '10 seconds' AS online FROM arena_worker WHERE id=1")).rows[0];
    const standings = (await this.pool.query(`SELECT g.white,g.black,m.result FROM arena_games g JOIN validation_matches m ON m.id=g.match_id WHERE m.status IN ('win','draw')`)).rows;
    return { games, budget: { ...budget, limit: BUDGET_MICROS }, worker: worker ?? { online:false }, results: standings };
  }
  async detail(id: string) {
    const g = (await this.pool.query('SELECT * FROM arena_games WHERE match_id=$1',[id])).rows[0];
    if (!g) return null;
    const snapshot = await this.snapshot(id), referee = new Referee(snapshot.initial_fen);
    const frames = [{ seq:0,fen:referee.chess.fen(),san:'Start',moveUci:'' }];
    for (const move of snapshot.moves) { referee.play(move); frames.push({seq:frames.length,fen:referee.chess.fen(),san:referee.chess.history().at(-1)!,moveUci:move}); }
    const result = snapshot.result as Outcome;
    for (const [key,value] of Object.entries({White:agentName(g.white),Black:agentName(g.black),Event:'AI Chess Arena · Unrated',Site:'Agent Arena',Result:result.kind==='draw'?'1/2-1/2':result.kind==='win'?(result.winner==='w'?'1-0':'0-1'):'*',Termination:result.reason})) referee.chess.setHeader(key,value);
    const attempts = (await this.pool.query('SELECT version,agent,state,paid,cost_micros::float8,latency_ms,input_tokens,output_tokens,error FROM arena_attempts WHERE match_id=$1 ORDER BY version',[id])).rows;
    return { ...g,...snapshot,frames,attempts,pgn:referee.chess.pgn(),rankEligible:false };
  }
}
