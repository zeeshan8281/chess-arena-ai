import {sessionUser,requireUser,requireAgent,sameOrigin} from '../../../src/auth';
import {z} from 'zod';
import {getArena} from '../../../src/db';
import {PlayError} from '../../../src/community';
import {LeagueAction,profile,directory,createAgent,release,enter,activeTurns,leagueMove,cancelRun} from '../../../src/league';
export const dynamic='force-dynamic';
function error(e:unknown){return Response.json({error:e instanceof z.ZodError?'Check the agent name, version settings and identifiers.':e instanceof PlayError?e.message:'League unavailable. Please try again.'},{status:e instanceof z.ZodError?400:e instanceof PlayError?e.status:503})}
export async function GET(request:Request){try{const arena=await getArena(),url=new URL(request.url);const result=url.searchParams.has('turns')?{turns:await activeTurns(arena,(await requireAgent(arena,request)).id)}:url.searchParams.has('agent')?await profile(arena,url.searchParams.get('agent')!):await directory(arena);if(url.searchParams.has('agent')){const user=await sessionUser(arena,request);Object.assign(result,{signedIn:Boolean(user),isOwner:Boolean(user&&(await arena.pool.query('SELECT 1 FROM league_agents WHERE id=$1 AND github_id=$2',[url.searchParams.get('agent'),user.id])).rowCount)})}return Response.json(result,{headers:{'Cache-Control':'no-store'}})}catch(e){return error(e)}}
export async function POST(request:Request){try{
 const origin=request.headers.get('origin');if(origin&&new URL(origin).host!==request.headers.get('host'))throw new PlayError('Use the arena site or your own client.',403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw new PlayError('JSON required',415);
 const reader=request.body?.getReader();let bytes=0;const chunks:Uint8Array[]=[];try{while(reader){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>8192)throw new PlayError('Request too large',413);chunks.push(value)}}finally{await reader?.cancel().catch(()=>{});reader?.releaseLock()}const text=Buffer.concat(chunks).toString('utf8');let raw;try{raw=JSON.parse(text)}catch{throw new PlayError('Invalid JSON')}
 const body=LeagueAction.parse(raw),arena=await getArena();
 if(body.action==='create'){sameOrigin(request);const user=await requireUser(arena,request);return Response.json(await createAgent(arena,body.name,body.config,user.id),{status:201})}
 const agent=await requireAgent(arena,request,body.agentId);
 if(body.action==='release')return Response.json(await release(arena,agent.id,body.config),{status:201});
 if(body.action==='enter'){if(!(await arena.list()).worker.online)throw new PlayError('The league worker is starting. Try again shortly.',503);return Response.json(await enter(arena,agent.id,body.versionId,body.challenge,body.opponentId),{status:201})}
 if(body.action==='move')return Response.json(await leagueMove(arena,agent.id,body));
 return Response.json(await cancelRun(arena,agent.id,body.runId));
 }catch(e){return error(e)}}
