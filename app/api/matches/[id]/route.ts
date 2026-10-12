import { getArena } from '../../../../src/db';
import { matchId, mutationAllowed } from '../../../../src/http';
export const dynamic = 'force-dynamic';
type Context = {params:Promise<{id:string}>};
export async function GET(request:Request,context:Context) {
  const {id} = await context.params;
  if (!matchId.safeParse(id).success) return Response.json({error:'Invalid match id'},{status:400});
  try {
    const game = await (await getArena()).detail(id);
    if (!game) return Response.json({error:'Match not found'},{status:404});
    if (new URL(request.url).searchParams.get('format')==='pgn') return new Response(game.pgn,{headers:{'Content-Type':'application/x-chess-pgn','Content-Disposition':`attachment; filename="arena-${id}.pgn"`}});
    return Response.json(game,{headers:new URL(request.url).searchParams.get('format')==='json'?{'Content-Disposition':`attachment; filename="arena-${id}.json"`}:{}});
  } catch { return Response.json({error:'Could not load match'},{status:503}); }
}
export async function POST(request:Request,context:Context) {
  if (!mutationAllowed(request)) return Response.json({error:'Local same-origin controls only'},{status:403});
  const {id} = await context.params;
  if (!matchId.safeParse(id).success) return Response.json({error:'Invalid match id'},{status:400});
  try {
    const body = await request.json();
    if (body.action!=='cancel') return Response.json({error:'Unknown action'},{status:400});
    const arena = await getArena();
    if (!await arena.detail(id)) return Response.json({error:'Match not found'},{status:404});
    await arena.finish(id,{kind:'pending_adjudication',reason:'cancelled_by_operator'});
    return Response.json({ok:true});
  } catch { return Response.json({error:'Could not cancel match'},{status:503}); }
}
