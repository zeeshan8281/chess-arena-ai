import {isAnalyticsAdmin} from '../../../../src/analytics';
import {getArena} from '../../../../src/db';
import {sessionUser} from '../../../../src/auth';
export async function GET(request:Request){const arena=await getArena(),user=await sessionUser(arena,request);const agents=user?(await arena.pool.query('SELECT id,name FROM league_agents WHERE github_id=$1 ORDER BY created_at DESC',[user.id])).rows:[];return Response.json({user,agents,analyticsAdmin:isAnalyticsAdmin(user),configured:Boolean(process.env.GITHUB_CLIENT_ID&&process.env.GITHUB_CLIENT_SECRET)},{headers:{'Cache-Control':'no-store'}})}
