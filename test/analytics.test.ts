import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import {randomUUID} from 'node:crypto';
import {Arena} from '../src/arena';
import {createSession} from '../src/auth';
import {parsePageview,recordPageview,analyticsStats,requireAnalyticsAdmin,historicalPageview,importHistory} from '../src/analytics';
const connectionString=process.env.ARENA_TEST_DATABASE_URL;
if(!connectionString||new URL(connectionString).pathname!=='/arena_validation')throw Error('Dedicated test database required');
const schema='analytics_test_'+randomUUID().replaceAll('-',''),admin=new pg.Pool({connectionString}),pool=new pg.Pool({connectionString,options:`-c search_path=${schema}`}),arena=new Arena(pool);
test.before(async()=>{await admin.query(`CREATE SCHEMA ${schema}`);await arena.init()});
test.after(async()=>{await pool.end();await admin.query(`DROP SCHEMA ${schema} CASCADE`);await admin.end()});
test('tracking strips private URL values and rejects non-page paths',()=>{
 const e=parsePageview({id:randomUUID(),path:'/league?token=secret#build',referrer:'https://example.com/private?token=secret'});assert.equal(e.path,'/league');assert.equal(e.referrer,'example.com');
 assert.throws(()=>parsePageview({id:randomUUID(),path:'/api/auth/github/callback'}));assert.throws(()=>parsePageview({id:randomUUID(),path:'/analytics'}));
 assert.equal(parsePageview({id:randomUUID(),path:'/',referrer:'https://chessarena.fun/play'}).referrer,'Direct / unknown');
});
test('analytics requires site-owner session, not just any signed-in user',async()=>{
 const request=(token='')=>new Request('https://chessarena.fun/api/analytics',{headers:{cookie:'arena_session='+token}});
 await assert.rejects(requireAnalyticsAdmin(arena,request()),e=>(e as {status:number}).status===401);
 const other=await createSession(arena,{id:'visitor',login:'visitor'});await assert.rejects(requireAnalyticsAdmin(arena,request(other)),e=>(e as {status:number}).status===403);
 const owner=await createSession(arena,{id:'owner',login:process.env.ANALYTICS_ADMIN_LOGIN??'zeeshan8281'});assert.equal((await requireAnalyticsAdmin(arena,request(owner))).id,'owner');
});
test('views deduplicate delivery and historical imports stay separate and idempotent',async()=>{
 const e={id:randomUUID(),path:'/league',referrer:'https://github.com/'};await recordPageview(arena,e);await recordPageview(arena,e);
 const row={requestId:randomUUID(),timestamp:new Date().toISOString(),method:'GET',httpStatus:200,path:'/',clientUa:'Mozilla/5.0'};
 assert.equal(historicalPageview({...row,path:'/api/matches'}),null);assert.equal(historicalPageview({...row,clientUa:'Googlebot'}),null);assert.equal(historicalPageview({...row,path:'/league?_rsc=abc'}),null);assert.equal(historicalPageview({...row,httpStatus:404}),null);
 await importHistory(arena,[row,row],{from:row.timestamp,to:row.timestamp,deployments:1});await importHistory(arena,[row],{from:row.timestamp,to:row.timestamp,deployments:1});
 const stats=await analyticsStats(arena,7);assert.equal(stats.views,1);assert.equal(stats.historical,1);assert.equal(stats.today,1);assert.equal(stats.recent,1);assert.equal(stats.referrers[0].referrer,'github.com');assert.equal(stats.history.requests,1);
 await pool.query("UPDATE arena_pageviews SET created_at=now()-interval '8 days' WHERE source='railway'");assert.equal((await analyticsStats(arena,7)).historical,0);assert.equal((await analyticsStats(arena,30)).historical,1);
});
