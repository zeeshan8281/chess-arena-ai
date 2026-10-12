import pg from 'pg';
import { Arena } from './arena';
const globalDb = globalThis as typeof globalThis & { arenaPool?: pg.Pool; arenaInit?: Promise<void> };
export async function getArena() {
  const connectionString = process.env.ARENA_TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Database is not configured');
  const pool = globalDb.arenaPool ??= new pg.Pool({ connectionString, max: 8 });
  const arena = new Arena(pool);
  try { await (globalDb.arenaInit ??= arena.init()); } catch(e) { globalDb.arenaInit = undefined; throw e; }
  return arena;
}
