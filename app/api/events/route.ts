import pg from 'pg';
import {Store} from '../../../src/store';
import demo from '../../../data/demo.json';
export const dynamic='force-dynamic';
export async function GET(request:Request){
  const cursorText=new URL(request.url).searchParams.get('after') ?? request.headers.get('last-event-id') ?? '0';
  if(!/^\d+$/.test(cursorText) || !Number.isSafeInteger(Number(cursorText)))return new Response('Invalid cursor',{status:400});
  const connectionString=process.env.ARENA_TEST_DATABASE_URL;
  if(!connectionString)return new Response('Validation database is offline',{status:503});
  const pool=new pg.Pool({connectionString});
  try{
    const events=await new Store(pool).eventsAfter(demo.id,Number(cursorText));
    const body=events.map(event=>`id: ${event.seq}\nevent: move\ndata: ${JSON.stringify(event)}\n\n`).join('');
    // shortcut: finite persisted replay response; continuous live fan-out is a separate production gate.
    return new Response(body+'event: complete\ndata: {}\n\n',{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-cache','X-Accel-Buffering':'no'}});
  }catch(error){
    if(error instanceof RangeError)return new Response('Cursor ahead of recorded game; reload the snapshot',{status:409});
    return new Response('Replay database unavailable',{status:503});
  }finally{await pool.end();}
}
