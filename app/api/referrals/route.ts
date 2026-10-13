import {getArena} from '../../../src/db';
import {requireUser,origin} from '../../../src/auth';
import {referralStats} from '../../../src/referrals';
import {playError} from '../../../src/play-http';
export async function GET(request:Request){try{const arena=await getArena(),user=await requireUser(arena,request),stats=await referralStats(arena,user.id);return Response.json({url:origin()+'/r/'+stats.code,signups:stats.signups,builders:stats.builders},{headers:{'Cache-Control':'no-store'}})}catch(e){return playError(e)}}
