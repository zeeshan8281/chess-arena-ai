import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import pg from 'pg';
import {Arena,BUDGET_ID} from '../src/arena';
import {RESERVE_MICROS} from '../src/openrouter';
const connectionString=process.env.ARENA_TEST_DATABASE_URL;
if(!connectionString||new URL(connectionString).pathname!=='/arena_validation')throw new Error('Dedicated arena_validation database required');
const schema='arena_test_'+randomUUID().replaceAll('-','');
const admin=new pg.Pool({connectionString});
const pool=new pg.Pool({connectionString,options:`-c search_path=${schema}`});
const arena=new Arena(pool);
test.before(async()=>{await admin.query(`CREATE SCHEMA ${schema}`);await arena.init()});
test.after(async()=>{await pool.end();await admin.query(`DROP SCHEMA ${schema} CASCADE`);await admin.end()});
async function game(){return (await arena.createGames('local-search','local-random',false))[0]}
test('dispatch reserves once, settlement refunds once, and an interrupted turn cannot redispatch',async()=>{
 const id=await game(),lease=(await arena.claim(id,'test'))!;
 const balance=async()=>Number((await pool.query('SELECT available FROM validation_accounts WHERE id=$1',[BUDGET_ID])).rows[0].available);
 const before=await balance();
 assert.equal(await arena.beginAttempt(lease,'openai/gpt-4.1-mini',true),'ready');
 assert.equal(await balance(),before-RESERVE_MICROS);
 assert.equal(await arena.beginAttempt(lease,'openai/gpt-4.1-mini',true),'interrupted');
 await arena.recordAttempt(lease.attemptId,{costMicros:1234,latencyMs:10});
 await arena.recordAttempt(lease.attemptId,{costMicros:0,latencyMs:10});
 assert.equal(await balance(),before-1234);
 assert.equal((await pool.query('SELECT * FROM validation_reservations WHERE id=$1',[lease.attemptId])).rowCount,0);
 await arena.finish(id,{kind:'pending_adjudication',reason:'test_finished'});
});
test('budget exhaustion does not dispatch and unknown billing retains its reservation',async()=>{
 const id=await game(),lease=(await arena.claim(id,'test'))!;
 await pool.query('UPDATE validation_accounts SET available=$2 WHERE id=$1',[BUDGET_ID,RESERVE_MICROS-1]);
 assert.equal(await arena.beginAttempt(lease,'openai/gpt-4.1-mini',true),'budget');
 assert.equal((await pool.query('SELECT * FROM arena_attempts WHERE id=$1',[lease.attemptId])).rowCount,0);
 await pool.query('UPDATE validation_accounts SET available=$2 WHERE id=$1',[BUDGET_ID,RESERVE_MICROS]);
 assert.equal(await arena.beginAttempt(lease,'openai/gpt-4.1-mini',true),'ready');
 await arena.recordAttempt(lease.attemptId,{costMicros:null,latencyMs:30,error:'Connection lost'});
 assert.equal(Number((await pool.query('SELECT amount FROM validation_reservations WHERE id=$1',[lease.attemptId])).rows[0].amount),RESERVE_MICROS);
 await arena.finish(id,{kind:'pending_adjudication',reason:'test_finished'});
});
test('cancel fences an in-flight move and creates a resumable terminal event',async()=>{
 const id=await game(),lease=(await arena.claim(id,'test'))!;
 assert.equal(await arena.finish(id,{kind:'pending_adjudication',reason:'cancelled_by_operator'}),true);
 await assert.rejects(arena.commitMove(lease,{attemptId:lease.attemptId,moveUci:'e2e4'},{elapsedMs:1,limitMs:1000}),/Stale/);
 const detail=await arena.detail(id);assert.equal(detail!.moves.length,0);assert.equal(detail!.cursor,1);
 const events=await arena.eventsAfter(id,0);assert.equal(events.length,1);assert.equal(events[0].result.reason,'cancelled_by_operator');
});
test('queue capacity is serialized and color pairs are atomically swapped',async()=>{
 const ids=await arena.createGames('local-search','local-random',true);
 const a=await arena.detail(ids[0]),b=await arena.detail(ids[1]);assert.equal(a!.white,b!.black);assert.equal(a!.pair_id,b!.pair_id);
 const admitted=await Promise.allSettled([arena.createGames('local-search','local-random',true),arena.createGames('local-search','local-random',true)]);
 assert.equal(admitted.filter(r=>r.status==='fulfilled').length,1);
 const active=(await pool.query("SELECT id FROM validation_matches WHERE status='ongoing'")).rows;
 assert.equal(active.length,4);for(const row of active)await arena.finish(row.id,{kind:'pending_adjudication',reason:'test_finished'});
});
