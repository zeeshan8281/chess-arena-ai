import {getArena} from '../../../src/db';
import {cookie,origin,setCookie} from '../../../src/auth';
import {validReferral} from '../../../src/referrals';
export async function GET(request:Request,{params}:{params:Promise<{code:string}>}){
 const {code}=await params,base=origin();
 if(request.headers.get('host')!==new URL(base).host)return Response.redirect(base+'/r/'+encodeURIComponent(code));
 const headers=new Headers({Location:base+'/login?invite=1&next=%2Fleague%23build','Cache-Control':'no-store','X-Robots-Tag':'noindex'});
 if(!validReferral(code))return Response.redirect(base+'/login');
 const arena=await getArena();if(!(await arena.pool.query('SELECT 1 FROM auth_users WHERE referral_code=$1',[code])).rowCount)return Response.redirect(base+'/login');
 const previous=cookie(request,'arena_referral');const exists=validReferral(previous)&&(await arena.pool.query('SELECT 1 FROM auth_users WHERE referral_code=$1',[previous])).rowCount;
 if(!exists)headers.append('Set-Cookie',setCookie('arena_referral',code,30*24*60*60));
 return new Response(null,{status:302,headers});
}
