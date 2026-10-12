import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import {randomUUID} from 'node:crypto';
import {Arena} from '../src/arena';
import {Referee} from '../src/rules';
import {Harness,harnessMove,harnessCandidates,CHALLENGES} from '../src/harness';
import {createAgent,owner,release,profile,enter,processLeagueGame,activeTurns,leagueMove,cancelRun,progress,LeagueAction} from '../src/league';
const connectionString=process.env.ARENA_TEST_DATABASE_URL;
if(!connectionString||new URL(connectionString).pathname!=='/arena_validation')throw Error('Dedicated test database required');
const schema='league_test_'+randomUUID().replaceAll('-',''),admin=new pg.Pool({connectionString}),pool=new pg.Pool({connectionString,options:`-c search_path=${schema}`}),arena=new Arena(pool);
const base=Harness.parse({brain:'capture',mateGuard:true,memory:'recent',label:'v1'});
test.before(async()=>{await admin.query(`CREATE SCHEMA ${schema}`);await arena.init()});test.after(async()=>{await pool.end();await admin.query(`DROP SCHEMA ${schema} CASCADE`);await admin.end()});
async function tick(id:string){const game=(await pool.query('SELECT * FROM arena_games WHERE match_id=$1',[id])).rows[0];await processLeagueGame(arena,game,'test-worker')}
async function finishByMoves(id:string,moves:string[]){for(const moveUci of moves){const lease=(await arena.claim(id,'fixture'))!;await arena.commitMove(lease,{attemptId:lease.attemptId,moveUci},{elapsedMs:0,limitMs:1000})}}
test('ownership keys never enter public profiles; versions preserve prior configurations and concurrent numbering',async()=>{
 const a=await createAgent(arena,'Test Contender',base);assert.equal((await owner(arena,a.token)).id,a.id);await assert.rejects(owner(arena,'0'.repeat(64)),/not recognized/);
 const [v2,v3]=await Promise.all([release(arena,a.id,{...base,safety:true,label:'safe'}),release(arena,a.id,{...base,center:true,label:'center'})]);assert.notEqual(v2.versionId,v3.versionId);
 const p=await profile(arena,a.id);assert.deepEqual(p.versions.map((v:any)=>v.number),[3,2,1]);assert.equal(p.versions.find((v:any)=>v.number===1).config.safety,false);assert.equal(new Set(p.versions.map((v:any)=>v.config_hash)).size,3);assert.ok(!JSON.stringify(p).includes(a.token));assert.ok(!JSON.stringify(p).includes('token_hash'));
});
test('challenge admission is atomic, uses both colors, enforces owner/version and unlock requirements',async()=>{
 const a=await createAgent(arena,'Admission',base),b=await createAgent(arena,'Other',base);
 await assert.rejects(enter(arena,b.id,a.versionId,'rookie'),/your versions/);await assert.rejects(enter(arena,a.id,a.versionId,'tactics'),/unlock/);
 const results=await Promise.allSettled([enter(arena,a.id,a.versionId,'rookie'),enter(arena,a.id,a.versionId,'rookie')]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 const run=results.find(r=>r.status==='fulfilled')! as PromiseFulfilledResult<{runId:string;ids:string[]}>;
 const p=await profile(arena,a.id);assert.deepEqual(p.runs[0].games.map((g:any)=>g.color),['w','b']);
 await assert.rejects(cancelRun(arena,b.id,run.value.runId),/not found/);await cancelRun(arena,a.id,run.value.runId);assert.equal((await profile(arena,a.id)).progress.completed,0);assert.equal(progress([{challenge:'rookie',games:[{color:'w',status:'win',result:{kind:'win',winner:'w',reason:'checkmate'}},{color:'b',status:'pending_adjudication',result:{kind:'pending_adjudication',reason:'cancelled_by_builder'}}]}]).points,0);
});
test('mate-only circuit respects side to move, earns one-time rewards, and does not turn caps into draws',async()=>{
 const a=await createAgent(arena,'Tactician',base),first=await enter(arena,a.id,a.versionId,'rookie');
 await finishByMoves(first.ids[0],['f2f3','e7e5','g2g4','d8h4']); // challenger white loses
 await finishByMoves(first.ids[1],['f2f3','e7e5','g2g4','d8h4']); // challenger black wins
 let p=await profile(arena,a.id);assert.equal(p.progress.points,125);assert.deepEqual(p.progress.cleared,['rookie']);
 const tactics=await enter(arena,a.id,a.versionId,'tactics');for(const id of tactics.ids){await tick(id);const s=await arena.snapshot(id);assert.equal(s.status,'win')}
 p=await profile(arena,a.id);assert.equal(p.progress.points,300);assert.equal(p.progress.tier,'Contender');
 const repeat=await enter(arena,a.id,a.versionId,'tactics');for(const id of repeat.ids)await tick(id);assert.equal((await profile(arena,a.id)).progress.points,300);
 const weak=await release(arena,a.id,{...base,brain:'random',mateGuard:false,memory:'none',label:'weak'});
 const capped=await enter(arena,a.id,weak.versionId,'tactics');for(const id of capped.ids){const s=await arena.snapshot(id),r=new Referee(s.initial_fen);const nonmate=r.legalUci().find(m=>{const q=new Referee(s.initial_fen);return q.play(m).kind==='ongoing'})!;await finishByMoves(id,[nonmate]);await tick(id);assert.equal((await arena.snapshot(id)).status,'pending_adjudication')}
 assert.equal((await profile(arena,a.id)).progress.points,300);
});
test('external harness owns only its current turns; cannot move for another agent or past the cap',async()=>{
 const a=await createAgent(arena,'External',Harness.parse({...base,brain:'custom'})),b=await createAgent(arena,'Stranger',base),run=await enter(arena,a.id,a.versionId,'rookie');
 const before=(await arena.list()).budget;
 const turns=await activeTurns(arena,a.id);assert.equal(turns.length,1);await assert.rejects(leagueMove(arena,b.id,{matchId:turns[0].matchId,version:0,moveUci:'e2e4'}),/owned/);
 await assert.rejects(leagueMove(arena,a.id,{matchId:turns[0].matchId,version:0,moveUci:'e2e5'}),/Illegal/);
 await leagueMove(arena,a.id,{matchId:turns[0].matchId,version:0,moveUci:'e2e4'});await assert.rejects(leagueMove(arena,a.id,{matchId:turns[0].matchId,version:0,moveUci:'d2d4'}));
 await tick(run.ids[1]);assert.ok((await activeTurns(arena,a.id)).some(t=>t.matchId===run.ids[1]));
 assert.deepEqual((await arena.list()).budget,before);await cancelRun(arena,a.id,run.runId);
});
test('duels preserve both version identities and award no challenge points',async()=>{
 const a=await createAgent(arena,'Duelist',base),v2=await release(arena,a.id,{...base,safety:true,label:'v2'}),run=await enter(arena,a.id,v2.versionId,'duel',a.versionId);
 for(const id of run.ids){await finishByMoves(id,['f2f3','e7e5','g2g4','d8h4'])}
 const p=await profile(arena,a.id);assert.equal(p.runs[0].opponent_id,a.versionId);assert.equal(p.progress.points,0);assert.equal(p.progress.completed,0);
});
test('composed modules affect actual choices and remain deterministic legal policies',()=>{
 const r=new Referee('7k/5K2/6Q1/8/8/8/8/8 w - - 0 1'),turn={fen:r.chess.fen(),legalMoves:r.legalUci(),historyUci:[],version:0};
 const strong=harnessMove(turn,base,17);assert.equal(r.play(strong).kind,'win');
 const opening=new Referee(),t={fen:opening.chess.fen(),legalMoves:opening.legalUci(),historyUci:[],version:0};
 const center=Harness.parse({...base,brain:'random',mateGuard:false,center:true});assert.notDeepEqual(harnessCandidates(t,center,17),harnessCandidates(t,{...center,center:false},17));
 for(const brain of ['random','capture','search'] as const){const c={...base,brain,depth:2 as const};const move=harnessMove(t,c,17);assert.ok(t.legalMoves.includes(move));assert.equal(move,harnessMove(t,c,17))}
 assert.throws(()=>LeagueAction.parse({action:'create',name:'x',config:{...base,extra:'code'}}));
});
test('model builds send their custom prompt while keeping bounded legal JSON and no retries',async()=>{
 const {openRouterMove}=await import('../src/openrouter');let requests=0;
 const result=await openRouterMove('openai/gpt-4.1-mini',{fen:new Referee().chess.fen(),historyUci:[],legalMoves:['e2e4','d2d4']},{apiKey:'test-only',systemPrompt:'Prefer central pawns.',fetch:(async(_url:any,init:any)=>{requests++;const body=JSON.parse(init.body);assert.ok(body.messages[0].content.startsWith('Prefer central pawns.'));assert.deepEqual(body.response_format.json_schema.schema.properties.moveUci.enum,['e2e4','d2d4']);assert.equal(body.provider.allow_fallbacks,false);return new Response(JSON.stringify({choices:[{message:{content:'{"moveUci":"e2e4"}'},finish_reason:'stop'}],usage:{cost:0}}))}) as typeof fetch});assert.equal(requests,1);assert.equal(result.costMicros,0);
});
