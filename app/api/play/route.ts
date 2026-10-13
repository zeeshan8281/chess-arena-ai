import {requireUser,requirePractice,sameOrigin} from '../../../src/auth';
import {getArena} from '../../../src/db';
import {createPractice,practiceTurn,PlayError} from '../../../src/community';
import {playBody,playerToken,playError} from '../../../src/play-http';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{
 const body=await playBody(request),arena=await getArena();sameOrigin(request);const user=await requireUser(arena,request);
 if(!(await arena.list()).worker.online)throw new PlayError('Practice worker is starting. Try again shortly.',503);
 const created=await createPractice(arena,body);await arena.pool.query('UPDATE arena_sessions SET github_id=$1 WHERE match_id=$2',[user.id,created.matchId]);return Response.json(created,{status:201,headers:{'Cache-Control':'no-store'}});
}catch(e){return playError(e)}}
export async function GET(request:Request){try{await requirePractice(await getArena(),request);return Response.json(await practiceTurn(await getArena(),playerToken(request)),{headers:{'Cache-Control':'no-store'}})}catch(e){return playError(e)}}
export async function DELETE(request:Request){try{await requirePractice(await getArena(),request);await playBody(request);const {stopPractice}=await import('../../../src/community');return Response.json(await stopPractice(await getArena(),playerToken(request)))}catch(e){return playError(e)}}
