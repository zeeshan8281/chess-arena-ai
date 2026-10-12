import {getArena} from '../../../src/db';
import {createPractice,practiceTurn,PlayError} from '../../../src/community';
import {playBody,playerToken,playError} from '../../../src/play-http';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{
 const body=await playBody(request),arena=await getArena();
 if(!(await arena.list()).worker.online)throw new PlayError('Practice worker is starting. Try again shortly.',503);
 return Response.json(await createPractice(arena,body),{status:201,headers:{'Cache-Control':'no-store'}});
}catch(e){return playError(e)}}
export async function GET(request:Request){try{return Response.json(await practiceTurn(await getArena(),playerToken(request)),{headers:{'Cache-Control':'no-store'}})}catch(e){return playError(e)}}
export async function DELETE(request:Request){try{await playBody(request);const {stopPractice}=await import('../../../src/community');return Response.json(await stopPractice(await getArena(),playerToken(request)))}catch(e){return playError(e)}}
