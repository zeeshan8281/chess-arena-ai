import {readFileSync} from 'node:fs';
import pg from 'pg';
import {Arena} from '../src/arena';
import {initAnalytics,importHistory} from '../src/analytics';
const file=process.argv[2];if(!file||!process.env.DATABASE_URL)throw Error('Usage: DATABASE_URL=... npx tsx scripts/import-analytics.ts /private/export.json');
const {rows,metadata}=JSON.parse(readFileSync(file,'utf8'));
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL}),arena=new Arena(pool);
try{await initAnalytics(arena);console.log(JSON.stringify({imported:await importHistory(arena,rows,metadata),coverage:metadata}))}finally{await pool.end()}
