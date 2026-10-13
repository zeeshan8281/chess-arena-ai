import {createHash} from 'node:crypto';
import {getArena} from '../../../../src/db';
import {secret,digest,origin,cookie,safeNext,setCookie,STATE_COOKIE} from '../../../../src/auth';
export async function GET(request:Request){
 const base=origin();if(request.headers.get('host')!==new URL(base).host)return Response.redirect(base+'/api/auth/github?next='+encodeURIComponent(safeNext(new URL(request.url).searchParams.get('next'))));
 if(!process.env.GITHUB_CLIENT_ID||!process.env.GITHUB_CLIENT_SECRET)return Response.redirect(base+'/login?error=setup');
 const arena=await getArena(),state=secret(),verifier=secret(),next=safeNext(new URL(request.url).searchParams.get('next'));
 await arena.pool.query('DELETE FROM auth_flows WHERE expires_at<now()');
 await arena.pool.query("INSERT INTO auth_flows(state_hash,verifier,next_path,expires_at,referral_code) VALUES($1,$2,$3,now()+interval '10 minutes',$4)",[digest(state),verifier,next,cookie(request,'arena_referral')||null]);
 const url=new URL('https://github.com/login/oauth/authorize');url.search=new URLSearchParams({client_id:process.env.GITHUB_CLIENT_ID,redirect_uri:base+'/api/auth/github/callback',scope:'',state,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'}).toString();
 return new Response(null,{status:302,headers:{Location:url.href,'Set-Cookie':setCookie(STATE_COOKIE,state,600),'Cache-Control':'no-store'}});
}
