import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import {randomUUID} from 'node:crypto';
import {Arena} from '../src/arena';
import {Harness} from '../src/harness';
import {createAgent} from '../src/league';
import {createSession,sessionUser,requireAgent,claimAgent,digest,consumeFlow,sameOrigin,safeNext} from '../src/auth';
const connectionString=process.env.ARENA_TEST_DATABASE_URL;
if(!connectionString||new URL(connectionString).pathname!=='/arena_validation')throw Error('Dedicated test database required');
const schema='auth_test_'+randomUUID().replaceAll('-',''),admin=new pg.Pool({connectionString}),pool=new pg.Pool({connectionString,options:`-c search_path=${schema}`}),arena=new Arena(pool);
test.before(async()=>{await admin.query(`CREATE SCHEMA ${schema}`);await arena.init()});
test.after(async()=>{await pool.end();await admin.query(`DROP SCHEMA ${schema} CASCADE`);await admin.end()});
const user={id:'auth-fixture',login:'fixture'};
const request=(token:string)=>new Request('https://chessarena.fun/api/league',{headers:{cookie:'arena_session='+token,origin:'https://chessarena.fun'}});
test('session tokens are hashed, expire, and do not authenticate after revocation',async()=>{
 const token=await createSession(arena,user);assert.deepEqual(await sessionUser(arena,request(token)),user);
 const row=(await pool.query('SELECT token_hash FROM auth_sessions WHERE user_id=$1',[user.id])).rows[0];assert.equal(row.token_hash,digest(token));assert.notEqual(row.token_hash,token);
 await pool.query("UPDATE auth_sessions SET expires_at=now()-interval '1 second' WHERE token_hash=$1",[digest(token)]);assert.equal(await sessionUser(arena,request(token)),null);
 const fresh=await createSession(arena,user);await pool.query('DELETE FROM auth_sessions WHERE token_hash=$1',[digest(fresh)]);assert.equal(await sessionUser(arena,request(fresh)),null);
});
test('legacy agents require GitHub linking; session and client ownership cannot cross agents',async()=>{
 const session=await createSession(arena,user),a=await createAgent(arena,'Legacy',Harness.parse({brain:'random',label:'first'}));
 const client=new Request('https://chessarena.fun/api/league?turns=1',{headers:{authorization:'Bearer '+a.token}});
 await assert.rejects(requireAgent(arena,client),/Sign in/);
 await assert.rejects(claimAgent(arena,user,a.id,'0'.repeat(64)),/cannot link/);
 await claimAgent(arena,user,a.id,a.token);assert.equal((await requireAgent(arena,client)).id,a.id);assert.equal((await requireAgent(arena,request(session),a.id)).id,a.id);
 await assert.rejects(requireAgent(arena,client,randomUUID()),/ownership/);
 await createSession(arena,{id:'other',login:'other'});await assert.rejects(claimAgent(arena,{id:'other',login:'other'},a.id,a.token),/cannot link/);
 const otherSession=await createSession(arena,{id:'other',login:'other'});await assert.rejects(requireAgent(arena,request(otherSession),a.id),/ownership/);
});
test('OAuth state is consumed once and expired state is rejected',async()=>{
 await pool.query("INSERT INTO auth_flows(state_hash,verifier,next_path,expires_at) VALUES($1,'verifier','/league',now()+interval '1 minute')",[digest('state')]);assert.equal((await consumeFlow(arena,'state')).verifier,'verifier');assert.equal(await consumeFlow(arena,'state'),undefined);
 await pool.query("INSERT INTO auth_flows(state_hash,verifier,next_path,expires_at) VALUES($1,'verifier','/league',now()-interval '1 minute')",[digest('expired')]);assert.equal(await consumeFlow(arena,'expired'),undefined);
});
test('cross-origin writes and external return URLs are rejected',()=>{
 assert.throws(()=>sameOrigin(new Request('https://chessarena.fun/api/league',{headers:{origin:'https://attacker.example'}})),/arena site/);
 assert.throws(()=>sameOrigin(new Request('https://chessarena.fun/api/league')),/arena site/);
 sameOrigin(request(''));assert.equal(safeNext('//attacker.example'),'/league');assert.equal(safeNext('/\\attacker.example'),'/league');assert.equal(safeNext('https://attacker.example'),'/league');assert.equal(safeNext('/league#build'),'/league#build');
});
test('referrals credit new GitHub users once, preserve the original inviter, and count activated builders',async()=>{
 const {referralStats}=await import('../src/referrals');
 const inviter={id:'invite-a',login:'inviter-a'},other={id:'invite-b',login:'inviter-b'},newcomer={id:'invite-new',login:'newcomer'};
 await createSession(arena,inviter);await createSession(arena,other);
 const a=await referralStats(arena,inviter.id),b=await referralStats(arena,other.id);assert.equal(a.code,(await referralStats(arena,inviter.id)).code);
 await Promise.all([createSession(arena,newcomer,a.code),createSession(arena,newcomer,a.code)]);
 await createSession(arena,newcomer,b.code);await createSession(arena,inviter,a.code);await createSession(arena,other,a.code);
 assert.equal((await referralStats(arena,inviter.id)).signups,1);assert.equal((await referralStats(arena,other.id)).signups,0);
 assert.equal((await referralStats(arena,inviter.id)).builders,0);
 await createAgent(arena,'Referred Builder',Harness.parse({brain:'random',label:'first'}),newcomer.id);
 await createAgent(arena,'Second Build',Harness.parse({brain:'random',label:'first'}),newcomer.id);
 assert.equal((await referralStats(arena,inviter.id)).builders,1);
 await createSession(arena,{id:'bad-ref',login:'invalid'},'invalid');assert.equal((await referralStats(arena,inviter.id)).signups,1);
});
