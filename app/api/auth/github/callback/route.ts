import {getArena} from '../../../../../src/db';
import {cookie,STATE_COOKIE,SESSION_COOKIE,origin,setCookie,consumeFlow,createSession} from '../../../../../src/auth';
export async function GET(request:Request){const base=origin();try{
 const url=new URL(request.url),state=url.searchParams.get('state'),code=url.searchParams.get('code');
 if(!state||!code||state!==cookie(request,STATE_COOKIE)||!/^[a-f0-9]{64}$/.test(state))throw Error();
 const arena=await getArena(),flow=await consumeFlow(arena,state);if(!flow)throw Error();
 const response=await fetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({client_id:process.env.GITHUB_CLIENT_ID,client_secret:process.env.GITHUB_CLIENT_SECRET,code,redirect_uri:base+'/api/auth/github/callback',code_verifier:flow.verifier}),signal:AbortSignal.timeout(15000)});
 const grant=await response.json();if(!response.ok||typeof grant.access_token!=='string')throw Error();
 const identity=await fetch('https://api.github.com/user',{headers:{Authorization:`Bearer ${grant.access_token}`,Accept:'application/vnd.github+json','User-Agent':'ChessArena'},signal:AbortSignal.timeout(15000)}),user=await identity.json();
 if(!identity.ok||!Number.isSafeInteger(user.id)||typeof user.login!=='string')throw Error();
 const token=await createSession(arena,{id:String(user.id),login:user.login},flow.referral_code),headers=new Headers({Location:base+flow.next_path,'Cache-Control':'no-store'});headers.append('Set-Cookie',setCookie(SESSION_COOKIE,token,604800));headers.append('Set-Cookie',setCookie(STATE_COOKIE,'',0));headers.append('Set-Cookie',setCookie('arena_referral','',0));
 return new Response(null,{status:302,headers});
 }catch{return new Response(null,{status:302,headers:{Location:base+'/login?error=callback','Set-Cookie':setCookie(STATE_COOKIE,'',0),'Cache-Control':'no-store'}})}
}
