import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {cpus} from 'node:os';
import {evaluatePolicy,policies,type PolicyFactory,SUITE} from '../src/evaluation';
import {localMove} from '../src/agents';
const definitions=[{id:'random-v1',label:'Random walk',detail:'Uniform legal move',create:policies['random-v1'].create},{id:'capture-v1',label:'Capture first',detail:'Highest-value capture',create:policies['capture-v1'].create},{id:'materialist-v1',label:'Materialist',detail:'Two-ply material search',create:(()=>((turn,random)=>localMove(turn.fen,'local-search',random))) as PolicyFactory}];
const hash=createHash('sha256');for(const f of ['src/evaluation.ts','src/agents.ts','src/rules.ts','scripts/benchmark-home.ts'])hash.update(await readFile(f));const sourceHash=hash.digest('hex');
await mkdir('public/benchmarks',{recursive:true});
const previous=JSON.parse(await readFile('public/benchmarks/summary.json','utf8').catch(()=>' {"rows":[]}'));
const rows=previous.rows.filter((r:{id:string})=>!definitions.some(d=>d.id===r.id));
for(const d of definitions){const timings:number[]=[];const create:PolicyFactory=()=>{const choose=d.create();return async(turn,random)=>{const started=performance.now();const result=await choose(turn,random);timings.push(performance.now()-started);return result}};
 const result=await evaluatePolicy(d.id,create,n=>{console.log(`${d.label}: ${n}/8`)},sourceHash);timings.sort((a,b)=>a-b);
 const percentile=(p:number)=>Number(timings[Math.min(timings.length-1,Math.floor((timings.length-1)*p))].toFixed(3));
 await writeFile(`public/benchmarks/${d.id}.json`,JSON.stringify(result,null,2)+'\n');
 rows.push({id:d.id,label:d.label,detail:d.detail,games:result.games.length,...result.totals,decisions:timings.length,medianMs:percentile(.5),p95Ms:percentile(.95),meanPlies:Number((result.games.reduce((n,g)=>n+g.plies,0)/result.games.length).toFixed(1)),evidence:`/benchmarks/${d.id}.json`});
}
await writeFile('public/benchmarks/summary.json',JSON.stringify({generatedAt:new Date().toISOString(),suite:SUITE,sourceHash,environment:{node:process.version,cpu:cpus()[0]?.model,platform:process.platform,arch:process.arch},rows},null,2)+'\n');console.log('Benchmark data saved.');
