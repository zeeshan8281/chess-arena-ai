import {createHash,randomBytes} from 'node:crypto';
import type {Arena} from './arena';
import {PlayError} from './community';
export const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
export const secret=()=>randomBytes(32).toString('hex');
export const SESSION_COOKIE='arena_session';
export const STATE_COOKIE='arena_oauth';
export type User={id:string;login:string};
export async function initAuth(arena:Arena){await arena.pool.query(`
 SELECT pg_advisory_xact_lock(773313);
 CREATE TABLE IF NOT EXISTS auth_users(id text PRIMARY KEY,login text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
 CREATE TABLE IF NOT EXISTS auth_sessions(token_hash text PRIMARY KEY,user_id text NOT NULL REFERENCES auth_users(id),expires_at timestamptz NOT NULL);
 CREATE TABLE IF NOT EXISTS auth_flows(state_hash text PRIMARY KEY,verifier text NOT NULL,next_path text NOT NULL,expires_at timestamptz NOT NULL);
 ALTER TABLE league_agents ADD COLUMN IF NOT EXISTS github_id text REFERENCES auth_users(id);
 ALTER TABLE arena_sessions ADD COLUMN IF NOT EXISTS github_id text REFERENCES auth_users(id);
 ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS referral_code text;
 CREATE UNIQUE INDEX IF NOT EXISTS auth_users_referral_code ON auth_users(referral_code);
 ALTER TABLE auth_users ADD COLUMN IF NOT EXISTS referred_by text REFERENCES auth_users(id);
 CREATE INDEX IF NOT EXISTS auth_users_referred_by ON auth_users(referred_by);
 ALTER TABLE auth_flows ADD COLUMN IF NOT EXISTS referral_code text;
 CREATE INDEX IF NOT EXISTS league_agents_github ON league_agents(github_id);
 `)}
export function cookie(request:Request,name:string){return (request.headers.get('cookie')??'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1)??''}
export function origin(){const value=process.env.AUTH_ORIGIN??'https://chessarena.fun';const u=new URL(value);if(u.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(u.hostname))throw Error('HTTPS required');return u.origin}
export function setCookie(name:string,value:string,maxAge:number){return `${name}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${origin().startsWith('https:')?'; Secure':''}`}
export function safeNext(value:string|null){return value&&/^\/(?!\/)[a-zA-Z0-9/_?#=&.%+-]*$/.test(value)?value:'/league'}
export function sameOrigin(request:Request){const supplied=request.headers.get('origin');const expected=origin();const local=new URL(request.url);if(supplied!==expected&&!( ['localhost','127.0.0.1'].includes(local.hostname)&&supplied===local.origin))throw new PlayError('Use the arena site for this action.',403)}
export async function sessionUser(arena:Arena,request:Request):Promise<User|null>{const token=cookie(request,SESSION_COOKIE);if(!/^[a-f0-9]{64}$/.test(token))return null;return (await arena.pool.query('SELECT u.id,u.login FROM auth_sessions s JOIN auth_users u ON u.id=s.user_id WHERE token_hash=$1 AND expires_at>now()',[digest(token)])).rows[0]??null}
export async function requireUser(arena:Arena,request:Request){const user=await sessionUser(arena,request);if(!user)throw new PlayError('Sign in with GitHub to contribute.',401);return user}
export async function createSession(arena:Arena,user:User,referralCode?:string){await arena.pool.query('INSERT INTO auth_users(id,login,referral_code,referred_by) VALUES($1,$2,$3,(SELECT id FROM auth_users WHERE referral_code=$4 AND id<>$1)) ON CONFLICT(id) DO UPDATE SET login=excluded.login',[user.id,user.login,randomBytes(12).toString('hex'),referralCode??null]);const token=secret();await arena.pool.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '7 days')",[digest(token),user.id]);return token}

export async function consumeFlow(arena:Arena,state:string){return (await arena.pool.query('DELETE FROM auth_flows WHERE state_hash=$1 AND expires_at>now() RETURNING verifier,next_path,referral_code',[digest(state)])).rows[0]}
export async function requireAgent(arena:Arena,request:Request,agentId?:string){
 const token=request.headers.get('authorization')?.replace(/^Bearer /,'');
 if(token){const a=(await arena.pool.query('SELECT id,name,github_id FROM league_agents WHERE token_hash=$1',[digest(token)])).rows[0];if(!a?.github_id)throw new PlayError('Sign in with GitHub and link this agent before connecting its harness.',401);if(agentId&&a.id!==agentId)throw new PlayError('Agent ownership required.',403);return a}
 sameOrigin(request);const user=await requireUser(arena,request);if(!agentId)throw new PlayError('Agent ID required.');const a=(await arena.pool.query('SELECT id,name FROM league_agents WHERE id=$1 AND github_id=$2',[agentId,user.id])).rows[0];if(!a)throw new PlayError('Agent ownership required.',403);return a;
}
export async function claimAgent(arena:Arena,user:User,agentId:string,token:string){const row=(await arena.pool.query('UPDATE league_agents SET github_id=$1 WHERE id=$2 AND token_hash=$3 AND (github_id IS NULL OR github_id=$1) RETURNING id',[user.id,agentId,digest(token)])).rows[0];if(!row)throw new PlayError('This key cannot link the agent to your account.',403);return row}
export async function requirePractice(arena:Arena,request:Request){const token=request.headers.get('authorization')?.replace(/^Bearer /,'')??'';if(!(await arena.pool.query('SELECT 1 FROM arena_sessions WHERE token_hash=$1 AND github_id IS NOT NULL AND expires_at>now()',[digest(token)])).rowCount)throw new PlayError('Start a practice game after signing in with GitHub.',401)}
