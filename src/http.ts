import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
export const matchId = z.string().uuid();
export function mutationAllowed(request: Request) {
  const url = new URL(request.url), host = request.headers.get('host')?.split(':')[0];
  const origin = request.headers.get('origin');
  if (!request.headers.get('content-type')?.startsWith('application/json')) return false;
  try { if (origin && new URL(origin).host !== request.headers.get('host')) return false; } catch { return false; }
  if (!process.env.RAILWAY_ENVIRONMENT_ID && ['127.0.0.1','localhost'].includes(host ?? '') && (!origin || origin === url.origin)) return true;
  const expected = process.env.ARENA_OPERATOR_TOKEN;
  const provided = request.headers.get('authorization')?.replace(/^Bearer /,'');
  return Boolean(expected && provided && Buffer.byteLength(expected) === Buffer.byteLength(provided) && timingSafeEqual(Buffer.from(expected),Buffer.from(provided)));
}
