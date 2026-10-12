try { process.loadEnvFile('.env.local'); } catch(e) { if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e; }
import { randomUUID } from 'node:crypto';
import { getArena } from './db';
import { Referee } from './rules';
import { localMove } from './agents';
import { openRouterMove, parseMove, MOVE_TIMEOUT_MS, RESERVE_MICROS } from './openrouter';
const arena = await getArena(), owner = randomUUID();
let stopping = false;
process.on('SIGTERM',()=>{stopping=true}); process.on('SIGINT',()=>{stopping=true});
const heartbeat = async()=>{await arena.pool.query('INSERT INTO arena_worker(id,heartbeat) VALUES(1,now()) ON CONFLICT(id) DO UPDATE SET heartbeat=now()')};
await heartbeat();
const timer = setInterval(()=>{void heartbeat().catch(()=>{});},2000);
console.log('Arena worker ready; persistent total budget: $5.00');
try {
  while (!stopping) {
    const games = (await arena.pool.query("SELECT g.* FROM arena_games g JOIN validation_matches m ON m.id=g.match_id WHERE m.status='ongoing' ORDER BY g.created_at")).rows;
    for (const game of games) {
      if (stopping) break;
      const lease = await arena.claim(game.match_id,owner,65_000);
      if (!lease) continue;
      try {
        const snapshot = await arena.snapshot(game.match_id), referee = new Referee(snapshot.initial_fen,snapshot.moves);
        const claim = referee.claimable()[0];
        if (claim) { await arena.finish(game.match_id,referee.claim(claim),lease); continue; }
        if (snapshot.moves.length >= game.max_plies) { await arena.finish(game.match_id,{kind:'pending_adjudication',reason:'move_limit_reached'},lease); continue; }
        const agent = referee.chess.turn()==='w'?game.white:game.black, paid = !agent.startsWith('local-');
        if (paid && !process.env.OPENROUTER_API_KEY) { await arena.finish(game.match_id,{kind:'pending_adjudication',reason:'provider_key_missing'},lease); continue; }
        const admission = await arena.beginAttempt(lease,agent,paid);
        if (admission !== 'ready') { await arena.finish(game.match_id,{kind:'pending_adjudication',reason:admission==='budget'?'budget_exhausted':'interrupted_attempt_not_retried'},lease); continue; }
        const started = performance.now();
        let moveUci: string;
        try {
          if (paid) {
            const reply = await openRouterMove(agent,{fen:referee.chess.fen(),legalMoves:referee.legalUci(),historyUci:referee.moves},{apiKey:process.env.OPENROUTER_API_KEY!});
            await arena.recordAttempt(lease.attemptId,reply);
            if (reply.costMicros !== null && reply.costMicros > RESERVE_MICROS) throw new Error('Provider exceeded reserved price ceiling');
            if (reply.finishReason !== 'stop' || typeof reply.content !== 'string') throw new Error('Model did not finish a move');
            moveUci = parseMove(reply.content,referee.legalUci());
          } else {
            moveUci = localMove(referee.chess.fen(),agent);
            await arena.recordAttempt(lease.attemptId,{costMicros:0,latencyMs:performance.now()-started});
          }
          await arena.commitMove(lease,{attemptId:lease.attemptId,moveUci},{elapsedMs:performance.now()-started,limitMs:MOVE_TIMEOUT_MS});
        } catch(e) {
          const message = e instanceof Error ? e.message : 'Move failed';
          await arena.recordAttempt(lease.attemptId,{costMicros:null,latencyMs:performance.now()-started,error:message});
          await arena.pool.query('UPDATE arena_attempts SET error=$2,state=\'failed\' WHERE id=$1',[lease.attemptId,message]);
          await arena.finish(game.match_id,{kind:'pending_adjudication',reason:'move_failed'},lease);
          console.error('Match stopped:',game.match_id,message);
        }
      } catch(e) { console.error('Worker turn:',game.match_id,e instanceof Error?e.message:'failed'); }
    }
    await new Promise(resolve=>setTimeout(resolve,games.length?350:1000));
  }
} finally { clearInterval(timer); await arena.pool.end(); }
