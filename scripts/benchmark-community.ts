import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {evaluatePolicy,type PolicyFactory} from '../src/evaluation';
import {harnessMove,Harness} from '../src/harness';
// Public configuration snapshot; never executes submitted code or connects owner clients.
const response=await fetch('https://chessarena.fun/api/league');if(!response.ok)throw Error('Directory unavailable');
const {agents}=await response.json();
const registry={capturedAt:new Date().toISOString(),source:'https://chessarena.fun/api/league',agents};
await writeFile('public/benchmarks/community.json',JSON.stringify(registry,null,2)+'\n');
const summary=JSON.parse(await readFile('public/benchmarks/summary.json','utf8'));
const sourceHash=createHash('sha256').update(await readFile('src/harness.ts')).update(await readFile('src/evaluation.ts')).update(await readFile('scripts/benchmark-community.ts')).digest('hex');
for(const agent of agents){const config=Harness.parse(agent.latest.config);if(['custom','model'].includes(config.brain))continue;
 const id='community-'+agent.latest.id,timings:number[]=[];
 const create:PolicyFactory=()=>((turn,random)=>{const start=performance.now();const move=harnessMove(turn,config,Math.floor(random()*0x100000000));timings.push(performance.now()-start);return move});
 const result=await evaluatePolicy(id,create,n=>console.log(agent.name+': '+n+'/8'),sourceHash);timings.sort((a,b)=>a-b);
 await writeFile(`public/benchmarks/${id}.json`,JSON.stringify({...result,agentId:agent.id,versionId:agent.latest.id,configHash:agent.latest.config_hash,config},null,2)+'\n');
 const row={id,label:agent.name,detail:`Build ${agent.latest.number} · ${config.brain} · depth ${config.depth} · ${config.memory} memory`,agentId:agent.id,configHash:agent.latest.config_hash,games:result.games.length,...result.totals,decisions:timings.length,medianMs:Number(timings[Math.floor((timings.length-1)*.5)].toFixed(3)),p95Ms:Number(timings[Math.floor((timings.length-1)*.95)].toFixed(3)),meanPlies:result.games.reduce((n,g)=>n+g.plies,0)/8,evidence:`/benchmarks/${id}.json`};
 summary.rows=summary.rows.filter((r:any)=>r.id!==id);summary.rows.push(row);
}
summary.generatedAt=new Date().toISOString();await writeFile('public/benchmarks/summary.json',JSON.stringify(summary,null,2)+'\n');
