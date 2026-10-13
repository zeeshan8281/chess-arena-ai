import {getArena} from '../../../src/db';
import {sameOrigin} from '../../../src/auth';
import {recordPageview,analyticsStats,requireAnalyticsAdmin} from '../../../src/analytics';
import {playError} from '../../../src/play-http';
import {PlayError} from '../../../src/community';
export async function POST(request:Request){try{
 sameOrigin(request);
 if(/bot|crawler|spider|headless|curl|python|wget/i.test(request.headers.get('user-agent')??''))return new Response(null,{status:204});
 if(Number(request.headers.get('content-length')??0)>4096)throw new PlayError('Request too large',413);
 const text=await request.text();if(text.length>4096)throw new PlayError('Request too large',413);
 let body;try{body=JSON.parse(text)}catch{throw new PlayError('Invalid JSON',400)}
 await recordPageview(await getArena(),body);return new Response(null,{status:204});
 }catch(e){return playError(e)}}
export async function GET(request:Request){try{const arena=await getArena();await requireAnalyticsAdmin(arena,request);const value=Number(new URL(request.url).searchParams.get('days')??7),days=[1,7,30].includes(value)?value:7;return Response.json(await analyticsStats(arena,days),{headers:{'Cache-Control':'private, no-store'}})}catch(e){return playError(e)}}
