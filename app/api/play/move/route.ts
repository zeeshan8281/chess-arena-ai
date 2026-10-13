import {requirePractice} from '../../../../src/auth';
import {getArena} from '../../../../src/db';
import {practiceMove} from '../../../../src/community';
import {playBody,playerToken,playError} from '../../../../src/play-http';
export async function POST(request:Request){try{await requirePractice(await getArena(),request);return Response.json(await practiceMove(await getArena(),playerToken(request),await playBody(request)),{headers:{'Cache-Control':'no-store'}})}catch(e){return playError(e)}}
