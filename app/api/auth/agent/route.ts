import {z} from 'zod';
import {getArena} from '../../../../src/db';
import {sameOrigin,requireUser,claimAgent,secret,digest} from '../../../../src/auth';
import {playError} from '../../../../src/play-http';
const Body=z.discriminatedUnion('action',[z.object({action:z.literal('claim'),agentId:z.string().uuid(),token:z.string().regex(/^[a-f0-9]{64}$/)}).strict(),z.object({action:z.literal('credentials'),agentId:z.string().uuid()}).strict()]);
export async function POST(request:Request){try{sameOrigin(request);const arena=await getArena(),user=await requireUser(arena,request),text=await request.text();if(text.length>1024)return Response.json({error:'Request too large'},{status:413});const b=Body.parse(JSON.parse(text));if(b.action==='claim')return Response.json(await claimAgent(arena,user,b.agentId,b.token));const token=secret();const updated=await arena.pool.query('UPDATE league_agents SET token_hash=$1 WHERE id=$2 AND github_id=$3 RETURNING id',[digest(token),b.agentId,user.id]);if(!updated.rowCount)return Response.json({error:'Agent ownership required.'},{status:403});return Response.json({token},{headers:{'Cache-Control':'no-store'}})}catch(e){return playError(e)}}
