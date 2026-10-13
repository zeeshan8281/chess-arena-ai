import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {DEFAULT_POSITION} from 'chess.js';
import {z} from 'zod';
import type {Arena} from './arena';
import {Referee} from './rules';
import {PlayError} from './community';
import {Harness,CHALLENGES,NPC,LEAGUE_PROTOCOL,externalHarness,harnessMove,type HarnessConfig} from './harness';
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
const uuid=z.string().uuid();
export const LeagueAction=z.discriminatedUnion('action',[
 z.object({action:z.literal('create'),name:z.string().trim().min(2).max(30).regex(/^[a-zA-Z0-9 _.-]+$/),config:Harness}).strict(),
 z.object({action:z.literal('release'),agentId:uuid.optional(),config:Harness}).strict(),
 z.object({action:z.literal('enter'),agentId:uuid.optional(),versionId:uuid,challenge:z.enum(['rookie','tactics','rival','duel']),opponentId:uuid.optional()}).strict(),
 z.object({action:z.literal('move'),agentId:uuid.optional(),matchId:uuid,version:z.number().int().nonnegative(),moveUci:z.string().regex(/^[a-h][1-8][a-h][1-8][qrbn]?$/)}).strict(),
 z.object({action:z.literal('cancel'),agentId:uuid.optional(),runId:uuid}).strict(),
]);
export async function initLeague(arena:Arena){await arena.pool.query(`
 SELECT pg_advisory_xact_lock(773310);
 CREATE TABLE IF NOT EXISTS league_agents(id uuid PRIMARY KEY,name text NOT NULL,token_hash text UNIQUE NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
 CREATE TABLE IF NOT EXISTS league_versions(id uuid PRIMARY KEY,agent_id uuid NOT NULL REFERENCES league_agents(id),number integer NOT NULL,config jsonb NOT NULL,config_hash text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(agent_id,number));
 CREATE TABLE IF NOT EXISTS league_runs(id uuid PRIMARY KEY,agent_id uuid NOT NULL REFERENCES league_agents(id),version_id uuid NOT NULL REFERENCES league_versions(id),challenge text NOT NULL,opponent_id uuid REFERENCES league_versions(id),created_at timestamptz NOT NULL DEFAULT now());
 CREATE TABLE IF NOT EXISTS league_games(match_id uuid PRIMARY KEY REFERENCES arena_games(match_id),run_id uuid NOT NULL REFERENCES league_runs(id),color text NOT NULL,seed integer NOT NULL);
 CREATE INDEX IF NOT EXISTS league_versions_agent ON league_versions(agent_id);
 CREATE INDEX IF NOT EXISTS league_runs_agent ON league_runs(agent_id);
 CREATE INDEX IF NOT EXISTS league_games_run ON league_games(run_id);
 `)}
export async function owner(arena:Arena,token:string){if(!/^[a-f0-9]{64}$/.test(token))throw new PlayError('Connect your agent with its owner key.',401);const row=(await arena.pool.query('SELECT id,name FROM league_agents WHERE token_hash=$1',[hash(token)])).rows[0];if(!row)throw new PlayError('Owner key not recognized.',401);return row as {id:string;name:string}}
export function progress(runs:any[]){
 const completed=runs.filter(r=>r.games.length===2&&r.games.every((g:any)=>g.status!=='ongoing'&&!['cancelled_by_builder','harness_connection_expired','harness_error'].includes(g.result.reason)));
 const cleared=CHALLENGES.filter(c=>completed.some(r=>r.challenge===c.id&&r.games.filter((g:any)=>g.result.kind==='win'&&g.result.winner===g.color).length>=c.target));
 const entered=new Set(completed.filter(r=>r.challenge!=='duel'&&r.games.every((g:any)=>!['cancelled_by_builder','harness_connection_expired','harness_error'].includes(g.result.reason))).map(r=>r.challenge));
 return {cleared:cleared.map(c=>c.id),completed:entered.size,points:cleared.reduce((n,c)=>n+c.reward,0)+entered.size*25,tier:cleared.length===3?'Champion':cleared.length===2?'Contender':cleared.length===1?'Challenger':'Rookie'};
}
export async function profile(arena:Arena,id:string){
 uuid.parse(id);const agent=(await arena.pool.query('SELECT id,name,created_at FROM league_agents WHERE id=$1',[id])).rows[0];if(!agent)throw new PlayError('Agent not found',404);
 const versions=(await arena.pool.query('SELECT id,agent_id,number,config,config_hash,created_at FROM league_versions WHERE agent_id=$1 ORDER BY number DESC',[id])).rows;
 const runs=(await arena.pool.query(`SELECT r.*,v.number AS version_number,v.config->>'label' AS version_label,ov.config->>'label' AS opponent_label FROM league_runs r JOIN league_versions v ON v.id=r.version_id LEFT JOIN league_versions ov ON ov.id=r.opponent_id WHERE r.agent_id=$1 ORDER BY r.created_at DESC`,[id])).rows;
 const games=(await arena.pool.query(`SELECT lg.*,m.status,m.result,jsonb_array_length(m.moves) AS plies,g.white,g.black FROM league_games lg JOIN league_runs r ON r.id=lg.run_id JOIN validation_matches m ON m.id=lg.match_id JOIN arena_games g ON g.match_id=lg.match_id WHERE r.agent_id=$1 ORDER BY lg.color DESC`,[id])).rows;
 for(const run of runs)run.games=games.filter(g=>g.run_id===run.id);
 return {...agent,versions,runs,progress:progress(runs)};
}
export async function directory(arena:Arena){const rows=(await arena.pool.query('SELECT id FROM league_agents ORDER BY created_at DESC LIMIT 60')).rows;const profiles=[];for(const row of rows){const p=await profile(arena,row.id);profiles.push({id:p.id,name:p.name,created_at:p.created_at,versions:p.versions.length,latest:p.versions[0],progress:p.progress})}return {agents:profiles.sort((a,b)=>b.progress.points-a.progress.points),challenges:CHALLENGES,protocol:LEAGUE_PROTOCOL}}
export async function createAgent(arena:Arena,name:string,config:HarnessConfig,githubId?:string){
 const id=randomUUID(),versionId=randomUUID(),token=randomBytes(32).toString('hex'),client=await arena.pool.connect();
 try{await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(773311)');if((await client.query("SELECT count(*)::int n FROM league_agents WHERE created_at>now()-interval '1 day'")).rows[0].n>=100)throw new PlayError('Daily builder capacity reached. Try again tomorrow.',429);
 await client.query('INSERT INTO league_agents(id,name,token_hash,github_id) VALUES($1,$2,$3,$4)',[id,name,hash(token),githubId??null]);
 await client.query('INSERT INTO league_versions(id,agent_id,number,config,config_hash) VALUES($1,$2,1,$3,$4)',[versionId,id,config,hash(JSON.stringify(config))]);await client.query('COMMIT');return {id,token,versionId};
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
}
export async function release(arena:Arena,agentId:string,config:HarnessConfig){const client=await arena.pool.connect();try{await client.query('BEGIN');await client.query('SELECT id FROM league_agents WHERE id=$1 FOR UPDATE',[agentId]);const {rows}=await client.query('SELECT count(*)::int n FROM league_versions WHERE agent_id=$1',[agentId]);if(rows[0].n>=40)throw new PlayError('This pilot supports 40 immutable versions per agent.',429);const id=randomUUID();await client.query('INSERT INTO league_versions(id,agent_id,number,config,config_hash) VALUES($1,$2,$3,$4,$5)',[id,agentId,rows[0].n+1,config,hash(JSON.stringify(config))]);await client.query('COMMIT');return {versionId:id}}catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}}
export async function enter(arena:Arena,agentId:string,versionId:string,challenge:string,opponentId?:string){
 const p=await profile(arena,agentId),version=p.versions.find((v:any)=>v.id===versionId);if(!version)throw new PlayError('Choose one of your versions.',403);
 const mission=CHALLENGES.find(c=>c.id===challenge);
 if(mission&&p.progress.completed<mission.requirement)throw new PlayError('Finish earlier challenges to unlock this one.',409);
 let opponent:any=null;if(challenge==='duel'){if(!opponentId||opponentId===versionId)throw new PlayError('Choose a different opponent version.');opponent=(await arena.pool.query('SELECT v.*,a.name FROM league_versions v JOIN league_agents a ON a.id=v.agent_id WHERE v.id=$1',[opponentId])).rows[0];if(!opponent)throw new PlayError('Opponent not found',404);if(externalHarness(opponent.config)&&opponent.agent_id!==agentId)throw new PlayError('External rivals must connect themselves; choose a server-run rival.');}else if(!mission)throw new PlayError('Unknown challenge');
 const client=await arena.pool.connect(),runId=randomUUID(),ids:string[]=[];
 try{await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(773312)');
 const count=(await client.query(`SELECT count(*) FILTER(WHERE m.status='ongoing')::int active,count(*) FILTER(WHERE r.agent_id=$1 AND m.status='ongoing')::int owned,count(*) FILTER(WHERE r.created_at>now()-interval '1 day')::int daily FROM league_runs r JOIN league_games lg ON lg.run_id=r.id JOIN validation_matches m ON m.id=lg.match_id`,[agentId])).rows[0];
 if(count.active+2>12||count.owned>0||count.daily+2>400)throw new PlayError('Finish your active challenge or wait for a league slot.',429);
 await client.query('INSERT INTO league_runs(id,agent_id,version_id,challenge,opponent_id) VALUES($1,$2,$3,$4,$5)',[runId,agentId,versionId,challenge,opponentId??null]);
 for(const color of ['w','b']){const id=randomUUID();ids.push(id);const name=`local-harness:${p.name} v${version.number}:${versionId}`,enemy=opponent?`local-harness:${opponent.name} v${opponent.number}:${opponent.id}`:`local-${challenge==='rival'?'capture':'random'}`;
 const fen=challenge==='tactics'?(color==='w'?'7k/5K2/6Q1/8/8/8/8/8 w - - 0 1':'8/8/8/8/8/6q1/5k2/7K b - - 0 1'):DEFAULT_POSITION;
 await client.query('INSERT INTO validation_matches(id,initial_fen,result) VALUES($1,$2,$3)',[id,fen,new Referee(fen).outcome()]);
 await client.query('INSERT INTO arena_games(match_id,pair_id,white,black,protocol,max_plies) VALUES($1,$2,$3,$4,$5,$6)',[id,runId,color==='w'?name:enemy,color==='b'?name:enemy,LEAGUE_PROTOCOL,mission?.maxPlies??160]);
 await client.query('INSERT INTO league_games(match_id,run_id,color,seed) VALUES($1,$2,$3,17)',[id,runId,color]);}
 await client.query('COMMIT');return {runId,ids};
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
}
export async function leagueContext(arena:Arena,id:string){return (await arena.pool.query(`SELECT lg.*,g.max_plies,r.agent_id,r.version_id,r.challenge,r.opponent_id,r.created_at,v.config,ov.config AS opponent_config,ov.agent_id AS opponent_agent_id FROM league_games lg JOIN arena_games g ON g.match_id=lg.match_id JOIN league_runs r ON r.id=lg.run_id JOIN league_versions v ON v.id=r.version_id LEFT JOIN league_versions ov ON ov.id=r.opponent_id WHERE lg.match_id=$1`,[id])).rows[0]}
export async function activeTurns(arena:Arena,agentId:string){const ids=(await arena.pool.query(`SELECT lg.match_id FROM league_games lg JOIN league_runs r ON r.id=lg.run_id LEFT JOIN league_versions ov ON ov.id=r.opponent_id JOIN validation_matches m ON m.id=lg.match_id WHERE (r.agent_id=$1 OR ov.agent_id=$1) AND m.status='ongoing' ORDER BY r.created_at`,[agentId])).rows;const turns=[];for(const row of ids){const ctx=await leagueContext(arena,row.match_id),s=await arena.snapshot(row.match_id),ref=new Referee(s.initial_fen,s.moves),primary=ref.chess.turn()===ctx.color,config=primary?ctx.config:ctx.opponent_config;if(s.moves.length>=ctx.max_plies||Date.now()-new Date(ctx.created_at).getTime()>1800000)continue;if((primary?ctx.agent_id:ctx.opponent_agent_id)!==agentId||!config||!externalHarness(config))continue;turns.push({matchId:row.match_id,versionId:primary?ctx.version_id:ctx.opponent_id,config,version:s.cursor,fen:ref.chess.fen(),historyUci:s.moves,legalMoves:ref.legalUci(),seed:ctx.seed,watchUrl:`/matches/${row.match_id}`})}return turns}
export async function leagueMove(arena:Arena,agentId:string,input:{matchId:string;version:number;moveUci:string}){const turn=(await activeTurns(arena,agentId)).find(t=>t.matchId===input.matchId);if(!turn)throw new PlayError('No external turn owned by this agent.',403);if(turn.version!==input.version)throw new PlayError('Turn changed; fetch again.',409);if(!turn.legalMoves.includes(input.moveUci))throw new PlayError('Illegal move.',422);const lease=await arena.claim(input.matchId,'league-client',10_000);if(!lease)throw new PlayError('Turn already claimed.',409);if(lease.version!==input.version){await arena.pool.query('UPDATE validation_matches SET owner=NULL,lease_until=NULL,attempt_id=NULL WHERE id=$1 AND fence=$2',[lease.id,lease.fence]);throw new PlayError('Turn changed; fetch again.',409);}const admission=await arena.beginAttempt(lease,'External harness',false);if(admission!=='ready'){await arena.finish(input.matchId,{kind:'pending_adjudication',reason:'harness_error'},lease);throw new PlayError('Interrupted harness turn. Enter a new challenge.',409);}await arena.commitMove(lease,{attemptId:lease.attemptId,moveUci:input.moveUci},{elapsedMs:0,limitMs:10_000});await arena.recordAttempt(lease.attemptId,{costMicros:0,latencyMs:0});return {ok:true}}
export async function cancelRun(arena:Arena,agentId:string,id:string){const run=(await arena.pool.query('SELECT id FROM league_runs WHERE id=$1 AND agent_id=$2',[id,agentId])).rows[0];if(!run)throw new PlayError('Run not found',404);for(const g of (await arena.pool.query('SELECT match_id FROM league_games WHERE run_id=$1',[id])).rows)await arena.finish(g.match_id,{kind:'pending_adjudication',reason:'cancelled_by_builder'});return {ok:true}}
export async function processLeagueGame(arena:Arena,game:any,worker:string){
 const ctx=await leagueContext(arena,game.match_id);if(!ctx)return;
 if(Date.now()-new Date(ctx.created_at).getTime()>30*60_000){await arena.finish(game.match_id,{kind:'pending_adjudication',reason:'harness_connection_expired'});return}
 const s=await arena.snapshot(game.match_id),ref=new Referee(s.initial_fen,s.moves);
 if(s.moves.length>=game.max_plies){await arena.finish(game.match_id,{kind:'pending_adjudication',reason:'move_limit_reached'});return}
 const claim=ref.claimable()[0];if(claim){await arena.finish(game.match_id,ref.claim(claim));return}
 const primary=ref.chess.turn()===ctx.color,config:HarnessConfig=primary?ctx.config:ctx.opponent_config??NPC[ctx.challenge];
 if(externalHarness(config))return;
 const lease=await arena.claim(game.match_id,worker,65_000);if(!lease)return;if(lease.version!==s.cursor){await arena.pool.query('UPDATE validation_matches SET owner=NULL,lease_until=NULL,attempt_id=NULL WHERE id=$1 AND fence=$2',[lease.id,lease.fence]);return;}
 try{const admission=await arena.beginAttempt(lease,primary?game[ctx.color==='w'?'white':'black']:'Challenge opponent',false);if(admission!=='ready')throw Error('Interrupted harness attempt');const started=performance.now();const moveUci=harnessMove({fen:ref.chess.fen(),historyUci:s.moves,legalMoves:ref.legalUci(),version:s.cursor},config,ctx.seed+s.moves.length*7919);await arena.commitMove(lease,{attemptId:lease.attemptId,moveUci},{elapsedMs:performance.now()-started,limitMs:45_000});await arena.recordAttempt(lease.attemptId,{costMicros:0,latencyMs:performance.now()-started})}catch{await arena.recordAttempt(lease.attemptId,{costMicros:0,latencyMs:0,error:'Harness execution failed'});await arena.finish(game.match_id,{kind:'pending_adjudication',reason:'harness_error'},lease)}
}
