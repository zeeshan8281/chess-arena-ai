import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {openRouterMove,parseMove,RESERVE_MICROS} from '../src/openrouter';
import {positionTurn,wilson,reserveAttempt,settleAttempt,responseFailure} from '../src/tactics-benchmark';
import {harnessMove,Harness} from '../src/harness';
const fixtureText=await readFile('public/benchmarks/tactics/positions.json','utf8');
const fixture=JSON.parse(fixtureText);
const fixtureHash=createHash('sha256').update(fixtureText).digest('hex');
const harnessSourceHash=createHash('sha256').update(await readFile('src/harness.ts')).digest('hex');
const apiKey=process.env.OPENROUTER_API_KEY;if(!apiKey)throw Error('Key required');
async function spend(){const r=await fetch('https://openrouter.ai/api/v1/key',{headers:{Authorization:'Bearer '+apiKey}});if(!r.ok)throw Error('Cannot verify total key usage');const {data}=await r.json();if(!Number.isFinite(data.usage))throw Error('Unknown spend');return data.usage as number}
const startingUsage=await spend();const allowance=Math.min(2,5-startingUsage);if(allowance<.1)throw Error('Insufficient budget');let reserved=0;
const models=[
 {id:'google/gemini-4-argon',label:'Gemini 4 Argon',reasoning:{effort:'low'}},
 {id:'openai/gpt-6-luna',label:'GPT-6 Luna',reasoning:{effort:'low'}},
 {id:'anthropic/claude-haiku-5.5',label:'Claude Haiku 5.5',reasoning:{effort:'low'}},
 {id:'google/gemini-2.5-flash-lite',label:'Gemini 2.5 Flash Lite',reasoning:{enabled:false}},
 {id:'qwen/qwen3-32b',label:'Qwen3 32B',reasoning:{enabled:false}},
 {id:'deepseek/deepseek-v4.1-flash',label:'DeepSeek V4.1 Flash',reasoning:{effort:'low'}},
];
const resume=process.argv.includes('--resume');
const modelFlag=process.argv.indexOf('--model');
const targetModel=modelFlag>=0?process.argv[modelFlag+1]:null;
if(modelFlag>=0&&!models.some(m=>m.id===targetModel))throw Error('Unknown --model; use a configured model ID');
const sourceHash=createHash('sha256').update(await readFile('src/tactics-benchmark.ts')).update(await readFile('src/openrouter.ts')).update(await readFile('scripts/benchmark-tactics.ts')).digest('hex');
// Archive exact executed source separately; never retrofit historical source hashes.
const sources=await Promise.all(['src/tactics-benchmark.ts','src/openrouter.ts','src/harness.ts','scripts/benchmark-tactics.ts'].map(async path=>({path,text:await readFile(path,'utf8')})));
await mkdir('verification/tactics-sources',{recursive:true});
await writeFile(`verification/tactics-sources/${sourceHash}.json`,JSON.stringify({sourceHash,fixtureHash,harnessSourceHash,fixture,sources},null,2));
let rows:any[]=[];
try{const prior=JSON.parse(await readFile('public/benchmarks/tactics/summary.json','utf8'));if(prior.suite!==fixture.id||prior.fixtureHash&&prior.fixtureHash!==fixtureHash)throw Error('Existing results use a different suite');rows=prior.rows}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error}
if(targetModel&&rows.some(r=>r.model===targetModel&&r.complete))throw Error('Target model already has completed evidence; use a new versioned suite to rerun');
await mkdir('public/benchmarks/tactics',{recursive:true});
async function save(){await writeFile('public/benchmarks/tactics/summary.json',JSON.stringify({suite:fixture.id,generatedAt:new Date().toISOString(),sourceHash,fixtureHash,harnessSourceHash,provenanceNote:'Summary updated by this runner; individual evidence files preserve their original execution sourceHash.',positions:fixture.positions.length,bands:fixture.bands.map((b:any)=>b[0]),protocol:'FEN + legal UCI moves + setup move; JSON schema; 1024 output-token cap; 45s deadline; no tools, retries, or repair. Model-specific reasoning settings recorded.',rows},null,2)+'\n')}
const registry=JSON.parse(await readFile('public/benchmarks/community.json','utf8'));
const entries=[...models.map(m=>({...m,kind:'model'})),...registry.agents.filter((a:any)=>!['model','custom'].includes(a.latest.config.brain)).map((a:any)=>({id:a.id,label:a.name,kind:'harness',config:a.latest.config,configHash:a.latest.config_hash,reasoning:null}))];
for(const entry of entries){if(targetModel?entry.id!==targetModel:rows.some(r=>r.id===entry.id.replaceAll('/','--')))continue;
 const priorRow=rows.find(r=>r.id===entry.id.replaceAll('/','--'));let priorEvidence:string|null=null;
 let cases:any[]=[];
 if(priorRow){if(!resume)throw Error('Existing incomplete evidence requires --resume; attempted positions are never retried');const prior=JSON.parse(await readFile('public'+priorRow.evidence,'utf8'));if(prior.fixtureHash&&prior.fixtureHash!==fixtureHash)throw Error('Cannot resume a changed fixture');cases=prior.cases.filter((c:any)=>c.attempted);await mkdir('public/benchmarks/tactics/archive',{recursive:true});priorEvidence=`/benchmarks/tactics/archive/${entry.id.replaceAll('/','--')}-${Date.now()}.json`;await writeFile('public'+priorEvidence,JSON.stringify(prior,null,2)+'\n')}
 let stopReason:string|null=null;
 for(const [index,p] of fixture.positions.entries()){if(cases.some(c=>c.id===p.id))continue;const turn=positionTurn(p.fenBefore,p.line);let move:string|null=null,error:string|null=null,latencyMs=0,costMicros=0,actualModel:string|null=null,requestId:string|null=null,finishReason:string|null=null,inputTokens:number|null=null,outputTokens:number|null=null,billingKnown=entry.kind!=='model',requestSent=false,errorKind:string|null=null;const started=performance.now();
  if(stopReason){cases.push({id:p.id,band:p.band,expected:p.line[1],move:null,correct:false,error:stopReason,attempted:false,latencyMs:0,costMicros:0,billingKnown:true,requestSent:false,errorKind:'skipped'});continue}
  try{if(entry.kind==='model'){
   reserved=reserveAttempt(reserved,Math.floor(allowance*1e6),RESERVE_MICROS);
   const benchmarkFetch:typeof fetch=(input,init)=>{const body=JSON.parse(String(init?.body));body.reasoning=entry.reasoning;requestSent=true;return fetch(input,{...init,body:JSON.stringify(body)})};
   const reply=await openRouterMove(entry.id,turn,{apiKey,fetch:benchmarkFetch});latencyMs=reply.latencyMs;actualModel=reply.model;requestId=reply.requestId;finishReason=reply.finishReason??null;inputTokens=reply.inputTokens;outputTokens=reply.outputTokens;
   if(reply.costMicros===null)throw Error('Unknown billing cost');costMicros=reply.costMicros;billingKnown=true;reserved=settleAttempt(reserved,RESERVE_MICROS,costMicros);if(typeof reply.content!=='string')throw Error('Missing model response content');move=parseMove(reply.content,turn.legalMoves);
  }else{move=harnessMove(turn,Harness.parse(entry.config),index+17);latencyMs=performance.now()-started}
  }catch(e){const failure=responseFailure(e);error=failure.message;errorKind=failure.kind;latencyMs=performance.now()-started;if(failure.stop)stopReason=error}
  cases.push({id:p.id,band:p.band,fen:turn.fen,expected:p.line[1],move,correct:move===p.line[1],error,attempted:entry.kind!=='model'||requestSent,latencyMs,costMicros,actualModel,requestId,finishReason,inputTokens,outputTokens,billingKnown:billingKnown||!requestSent,requestSent,errorKind});
  console.log(`${entry.label} ${index+1}/${fixture.positions.length}: ${error??(move===p.line[1]?'correct':'miss')} | run $${(reserved/1e6).toFixed(4)}`);
  await writeFile('verification/tactics-progress.json',JSON.stringify({model:entry.id,reservedMicros:reserved,cases},null,2));
 }
 const successes=cases.filter(c=>c.correct).length,errors=cases.filter(c=>c.error).length,attempted=cases.filter(c=>c.attempted).length,times=cases.filter(c=>c.attempted).map(c=>c.latencyMs).sort((a,b)=>a-b),id=entry.id.replaceAll('/','--');
 const row={id,model:entry.kind==='model'?entry.id:null,label:entry.label,kind:entry.kind,reasoning:entry.reasoning,configHash:entry.configHash??null,config:entry.config??null,unknownCostAttempts:cases.filter(c=>c.requestSent&&!c.billingKnown||entry.kind==='model'&&c.attempted&&c.error&&c.costMicros===0&&c.billingKnown===undefined).length,total:cases.length,attempted,successes,errors,accuracy:successes/cases.length,interval:wilson(successes,cases.length),medianMs:times[Math.floor(times.length/2)]??0,costMicros:cases.reduce((n,c)=>n+c.costMicros,0),complete:attempted===cases.length,stopReason,bands:fixture.bands.map(([band]:string[])=>({band,total:cases.filter(c=>c.band===band).length,successes:cases.filter(c=>c.band===band&&c.correct).length})),evidence:`/benchmarks/tactics/${id}.json`};
 await writeFile('public'+row.evidence,JSON.stringify({suite:fixture.id,sourceHash,fixtureHash,harnessSourceHash,priorEvidence,continuationNote:priorEvidence?'Previously attempted positions retained unchanged; only unattempted positions requested. See priorEvidence for original runner hash.':null,...row,cases},null,2)+'\n');rows=rows.filter(r=>r.id!==row.id);rows.push(row);await save();
 const usage=await spend();await writeFile('verification/tactics-spend.json',JSON.stringify({startingUsage,currentUsage:usage,reservedMicros:reserved,allowance},null,2));if(usage+.05>5)throw Error('Total cap reached');
}
console.log('Completed; total key usage $'+(await spend()).toFixed(6));
