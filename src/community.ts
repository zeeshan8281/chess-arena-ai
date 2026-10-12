import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {DEFAULT_POSITION} from 'chess.js';
import {z} from 'zod';
import type {Arena} from './arena';
import {Referee} from './rules';
export const Player = z.object({name:z.string().trim().min(1).max(30).regex(/^[a-zA-Z0-9 _.-]+$/)}).strict();
export const PlayerMove = z.object({version:z.number().int().nonnegative(),moveUci:z.string().regex(/^[a-h][1-8][a-h][1-8][qrbn]?$/)}).strict();
export class PlayError extends Error {constructor(message:string,readonly status=400){super(message)}}
const hash=(token:string)=>createHash('sha256').update(token).digest('hex');
export async function createPractice(arena:Arena,input:unknown){
 const {name}=Player.parse(input),token=randomBytes(32).toString('hex'),id=randomUUID(),client=await arena.pool.connect();
 try {
  await client.query('BEGIN'); await client.query('SELECT pg_advisory_xact_lock(664422)');
  const {rows}=await client.query(`SELECT count(*) FILTER(WHERE s.created_at>now()-interval '1 day')::int AS daily,
   count(*) FILTER(WHERE m.status='ongoing' AND s.expires_at>now())::int AS active FROM arena_sessions s JOIN validation_matches m ON m.id=s.match_id`);
  if(rows[0].daily>=200||rows[0].active>=12)throw new PlayError('Practice arena is busy. Please try again after a game finishes.',429);
  await client.query('INSERT INTO validation_matches(id,initial_fen,result) VALUES($1,$2,$3)',[id,DEFAULT_POSITION,new Referee().outcome()]);
  await client.query('INSERT INTO arena_games(match_id,pair_id,white,black,protocol) VALUES($1,$2,$3,$4,$5)',[id,randomUUID(),`guest:${name}:${id.slice(0,8)}`,'local-random','community-uci-v1']);
  await client.query('INSERT INTO arena_sessions(match_id,token_hash) VALUES($1,$2)',[id,hash(token)]);
  await client.query('COMMIT');return {token,matchId:id,watchUrl:`/matches/${id}`,expiresInSeconds:1800};
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
}
async function session(arena:Arena,token:string){
 if(!/^[a-f0-9]{64}$/.test(token))throw new PlayError('Invalid player token',401);
 const row=(await arena.pool.query('SELECT match_id,expires_at<=now() AS expired FROM arena_sessions WHERE token_hash=$1',[hash(token)])).rows[0];
 if(!row)throw new PlayError('Invalid player token',401);
 if(row.expired)throw new PlayError('Practice session expired. Start a new match.',410);
 return row.match_id as string;
}
export async function practiceTurn(arena:Arena,token:string){
 const id=await session(arena,token),s=await arena.snapshot(id),referee=new Referee(s.initial_fen,s.moves);
 return {matchId:id,status:s.status,result:s.result,version:s.cursor,yourTurn:s.status==='ongoing'&&referee.chess.turn()==='w',fen:referee.chess.fen(),historyUci:s.moves,legalMoves:s.status==='ongoing'&&referee.chess.turn()==='w'?referee.legalUci():[],watchUrl:`/matches/${id}`};
}
export async function practiceMove(arena:Arena,token:string,input:unknown){
 const move=PlayerMove.parse(input),turn=await practiceTurn(arena,token);
 if(!turn.yourTurn||turn.version!==move.version)throw new PlayError('Turn changed. Fetch the current position.',409);
 if(!turn.legalMoves.includes(move.moveUci))throw new PlayError('Illegal move; choose an entry from legalMoves',422);
 if(turn.historyUci.length>=160){await arena.finish(turn.matchId,{kind:'pending_adjudication',reason:'move_limit_reached'});return practiceTurn(arena,token)}
 const lease=await arena.claim(turn.matchId,'community',10_000);
 if(!lease)throw new PlayError('Move already being processed. Fetch the current position.',409);
 if(lease.version!==move.version){await arena.pool.query('UPDATE validation_matches SET owner=NULL,lease_until=NULL,attempt_id=NULL WHERE id=$1 AND fence=$2',[lease.id,lease.fence]);throw new PlayError('Turn changed. Fetch the current position.',409)}
 await arena.beginAttempt(lease,'Community player',false);
 await arena.commitMove(lease,{attemptId:lease.attemptId,moveUci:move.moveUci},{elapsedMs:0,limitMs:10_000});
 await arena.recordAttempt(lease.attemptId,{costMicros:0,latencyMs:0});
 return practiceTurn(arena,token);
}
export async function stopPractice(arena:Arena,token:string){const id=await session(arena,token);await arena.finish(id,{kind:'pending_adjudication',reason:'cancelled_by_player'});return {ok:true}}
