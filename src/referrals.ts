import {randomBytes} from 'node:crypto';
import type {Arena} from './arena';
export const validReferral=(code:string)=>/^[a-f0-9]{24}$/.test(code);
export async function referralStats(arena:Arena,userId:string){
 const {rows}=await arena.pool.query('UPDATE auth_users SET referral_code=coalesce(referral_code,$2) WHERE id=$1 RETURNING referral_code',[userId,randomBytes(12).toString('hex')]);
 const stats=(await arena.pool.query('SELECT count(*)::int AS signups,count(*) FILTER(WHERE EXISTS(SELECT 1 FROM league_agents a WHERE a.github_id=u.id))::int AS builders FROM auth_users u WHERE referred_by=$1',[userId])).rows[0];
 return {code:rows[0].referral_code,...stats};
}
