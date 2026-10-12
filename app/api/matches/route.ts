import { z } from 'zod';
import { getArena } from '../../../src/db';
import { agents } from '../../../src/agents';
import { mutationAllowed } from '../../../src/http';
export const dynamic = 'force-dynamic';
export async function GET() {
  try { return Response.json({ ...await (await getArena()).list(), agents, providerReady: Boolean(process.env.OPENROUTER_API_KEY), remote: Boolean(process.env.RAILWAY_ENVIRONMENT_ID) }); }
  catch { return Response.json({error:'Database unavailable. Check the local PostgreSQL service.'},{status:503}); }
}
export async function POST(request: Request) {
  if (!mutationAllowed(request)) return Response.json({error:'Match controls require a same-origin localhost request.'},{status:403});
  try {
    const text = await request.text();
    if (text.length > 2048) return Response.json({error:'Request too large'},{status:413});
    const body = z.object({white:z.string(),black:z.string(),paired:z.boolean().default(true)}).strict().parse(JSON.parse(text));
    if ([body.white,body.black].some(id=>!id.startsWith('local-')) && !process.env.OPENROUTER_API_KEY) return Response.json({error:'Configure OPENROUTER_API_KEY in .env.local first.'},{status:400});
    const arena = await getArena();
    const heartbeat = (await arena.pool.query("SELECT 1 FROM arena_worker WHERE heartbeat>now()-interval '10 seconds'")).rowCount;
    if (!heartbeat) return Response.json({error:'Worker is offline. Start npm run worker.'},{status:503});
    const ids = await arena.createGames(body.white,body.black,body.paired);
    return Response.json({ids},{status:201});
  } catch(e) { return Response.json({error:e instanceof z.ZodError?'Invalid match settings':e instanceof Error?e.message:'Could not create match'},{status:400}); }
}
