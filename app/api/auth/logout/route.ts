import {getArena} from '../../../../src/db';
import {sameOrigin,cookie,digest,SESSION_COOKIE,setCookie} from '../../../../src/auth';
export async function POST(request:Request){try{sameOrigin(request);await(await getArena()).pool.query('DELETE FROM auth_sessions WHERE token_hash=$1',[digest(cookie(request,SESSION_COOKIE))]);return Response.json({ok:true},{headers:{'Set-Cookie':setCookie(SESSION_COOKIE,'',0)}})}catch{return Response.json({error:'Use this site to sign out.'},{status:403})}}
