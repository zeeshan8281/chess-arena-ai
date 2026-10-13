import { getArena } from '../../../../../src/db';
import { matchId } from '../../../../../src/http';
export const dynamic = 'force-dynamic';
export async function GET(request:Request,context:{params:Promise<{id:string}>}) {
  const {id} = await context.params;
  const cursorText = request.headers.get('last-event-id') ?? new URL(request.url).searchParams.get('after') ?? '0';
  if (!matchId.safeParse(id).success || !/^\d+$/.test(cursorText) || !Number.isSafeInteger(Number(cursorText))) return new Response('Invalid match or cursor',{status:400});
  const arena = await getArena();
  const initial = await arena.detail(id);
  if (!initial) return new Response('Match not found',{status:404});
  if (Number(cursorText)>initial.cursor) return new Response('Cursor ahead of match',{status:409});
  const encoder = new TextEncoder(); let closed = false;
  const stream = new ReadableStream({
    async start(controller) {
      let cursor = Number(cursorText), sent = false, signature='';
      try {
        const until = Date.now()+55_000;
        while (!closed && !request.signal.aborted && Date.now()<until) {
          const game = await arena.detail(id);
          if (!game || closed || request.signal.aborted) break;
          const nextSignature=JSON.stringify([game.status,game.execution]);
          if (!sent || game.cursor>cursor || signature!==nextSignature) { controller.enqueue(encoder.encode(`id: ${game.cursor}\ndata: ${JSON.stringify(game)}\n\n`)); cursor=game.cursor; sent=true;signature=nextSignature; }
          else controller.enqueue(encoder.encode(': heartbeat\n\n'));
          if (game.status!=='ongoing') break;
          await new Promise(resolve=>setTimeout(resolve,1000));
        }
      } catch { if (!closed && !request.signal.aborted) controller.enqueue(encoder.encode('event: unavailable\ndata: {}\n\n')); }
      finally { if (!closed) { closed=true; controller.close(); } }
    }, cancel() { closed=true; },
  });
  return new Response(stream,{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'}});
}
