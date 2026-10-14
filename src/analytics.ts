import {z} from 'zod';
import type {Arena} from './arena';
import {requireUser,type User} from './auth';
import {PlayError} from './community';
export const pagePath=(value:string)=>{
 const path=value.split(/[?#]/)[0].replace(/\/$/,'')||'/';
 return /^(\/|\/(watch|league|lab|play|replay|contribute|referrals|login|benchmarks)|\/(agents|matches)\/[a-f0-9-]{36})$/.test(path)?path:null;
};
export const isAnalyticsAdmin=(user:User|null)=>Boolean(user&&user.login.toLowerCase()===(process.env.ANALYTICS_ADMIN_LOGIN??'zeeshan8281').toLowerCase());
export async function requireAnalyticsAdmin(arena:Arena,request:Request){const user=await requireUser(arena,request);if(!isAnalyticsAdmin(user))throw new PlayError('Analytics is restricted to the site owner.',403);return user}
export async function initAnalytics(arena:Arena){await arena.pool.query(`
 SELECT pg_advisory_xact_lock(773315);
 CREATE TABLE IF NOT EXISTS arena_pageviews(id text PRIMARY KEY,created_at timestamptz NOT NULL DEFAULT now(),path text NOT NULL,referrer text NOT NULL,source text NOT NULL CHECK(source IN ('browser','railway')));
 CREATE INDEX IF NOT EXISTS arena_pageviews_time ON arena_pageviews(created_at);
 CREATE TABLE IF NOT EXISTS arena_analytics_imports(id text PRIMARY KEY,metadata jsonb NOT NULL,imported_at timestamptz NOT NULL DEFAULT now());
 `)}
const Event=z.object({id:z.string().uuid(),path:z.string().max(200),referrer:z.string().max(2048).default('')}).strict();
export function parsePageview(body:unknown){const input=Event.parse(body),path=pagePath(input.path);if(!path)throw new PlayError('Not a tracked page.',400);let referrer='Direct / unknown';try{const u=new URL(input.referrer);if(['http:','https:'].includes(u.protocol)&&!['chessarena.fun','www.chessarena.fun','localhost','127.0.0.1'].includes(u.hostname))referrer=u.hostname.slice(0,253)}catch{}return {id:input.id,path,referrer}}
export async function recordPageview(arena:Arena,body:unknown){const e=parsePageview(body);await arena.pool.query("INSERT INTO arena_pageviews(id,path,referrer,source) VALUES($1,$2,$3,'browser') ON CONFLICT DO NOTHING",[e.id,e.path,e.referrer])}
export async function analyticsStats(arena:Arena,days:number){
 const since=new Date();since.setUTCHours(0,0,0,0);since.setUTCDate(since.getUTCDate()-days+1);
 const [totals,daily,pages,referrers,imports]=await Promise.all([
 arena.pool.query(`SELECT count(*) FILTER(WHERE source='browser')::int AS views,count(*) FILTER(WHERE source='railway')::int AS historical,count(*) FILTER(WHERE source='browser' AND created_at>=date_trunc('day',now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')::int AS today,count(*) FILTER(WHERE source='browser' AND created_at>now()-interval '30 minutes')::int AS recent FROM arena_pageviews WHERE created_at >= $1`,[since]),
 arena.pool.query(`SELECT to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD') AS day,count(*) FILTER(WHERE source='browser')::int AS views,count(*) FILTER(WHERE source='railway')::int AS historical FROM arena_pageviews WHERE created_at >= $1 GROUP BY 1 ORDER BY 1`,[since]),
 arena.pool.query(`SELECT path,count(*) FILTER(WHERE source='browser')::int AS views,count(*) FILTER(WHERE source='railway')::int AS historical FROM arena_pageviews WHERE created_at >= $1 GROUP BY path ORDER BY count(*) DESC LIMIT 50`,[since]),
 arena.pool.query(`SELECT referrer,count(*)::int AS views FROM arena_pageviews WHERE created_at >= $1 AND source='browser' GROUP BY referrer ORDER BY count(*) DESC LIMIT 20`,[since]),
 arena.pool.query('SELECT metadata,imported_at FROM arena_analytics_imports ORDER BY imported_at DESC LIMIT 1')]);
 return {...totals.rows[0],daily:daily.rows,pages:pages.rows,referrers:referrers.rows,history:imports.rows[0]?.metadata??null,days,updatedAt:new Date().toISOString()};
}
export type HistoricalRequest={requestId:string;timestamp:string;method:string;path:string;httpStatus:number;clientUa?:string};
export function historicalPageview(row:HistoricalRequest){
 const path=pagePath(row.path),ua=row.clientUa??'';
 if(row.method!=='GET'||row.httpStatus!==200||!path||/bot|crawler|spider|headless|curl|python|wget|node|undici|go-http|httpclient/i.test(ua)||!/^Mozilla\//.test(ua)||/[?&]_rsc=/.test(row.path)||!row.requestId||!Number.isFinite(Date.parse(row.timestamp)))return null;
 return {id:'railway:'+row.requestId,created_at:row.timestamp,path,referrer:'Unavailable in historical logs',source:'railway'};
}
export async function importHistory(arena:Arena,rows:HistoricalRequest[],metadata:Record<string,unknown>){
 const events=rows.map(historicalPageview).filter(e=>e!==null),client=await arena.pool.connect();
 try{await client.query('BEGIN');for(let i=0;i<events.length;i+=500){await client.query(`INSERT INTO arena_pageviews(id,created_at,path,referrer,source) SELECT id,created_at,path,referrer,source FROM jsonb_to_recordset($1::jsonb) AS e(id text,created_at timestamptz,path text,referrer text,source text) ON CONFLICT DO NOTHING`,[JSON.stringify(events.slice(i,i+500))])}
 await client.query(`INSERT INTO arena_analytics_imports(id,metadata) VALUES('railway-initial',$1) ON CONFLICT(id) DO UPDATE SET metadata=excluded.metadata,imported_at=now()`,[JSON.stringify({...metadata,requests:new Set(events.map(e=>e.id)).size})]);await client.query('COMMIT');return new Set(events.map(e=>e.id)).size;
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
}
