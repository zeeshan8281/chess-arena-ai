try{process.loadEnvFile('.env.local')}catch{}
import {readFile,writeFile,open,unlink} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {Harness,harnessCandidates,type HarnessConfig} from '../src/harness';
import {openRouterMove,parseMove,RESERVE_MICROS} from '../src/openrouter';
const args=process.argv.slice(2),option=(name:string,fallback='')=>{const i=args.indexOf(name);return i<0?fallback:args[i+1]??fallback};
const credentialsPath=resolve(option('--credentials','arena-agent.json'));
const credentials=JSON.parse(await readFile(credentialsPath,'utf8'));
const base=new URL(credentials.arena);if(base.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(base.hostname))throw Error('Use HTTPS or localhost');
if(!/^[a-f0-9]{64}$/.test(credentials.token))throw Error('Invalid owner credentials');
const budget=Number(option('--budget','0'));if(!Number.isFinite(budget)||budget<0||budget>5)throw Error('Choose an explicit budget between $0 and $5. Default is $0.');
const ledgerPath=credentialsPath+'.spend.json';let ledger:{reserved:number;spent:number};try{ledger=JSON.parse(await readFile(ledgerPath,'utf8'));if(!Number.isFinite(ledger.reserved)||!Number.isFinite(ledger.spent)||ledger.reserved<0||ledger.spent<0)throw Error()}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw Error('Invalid spend ledger; inspect it before continuing');ledger={reserved:0,spent:0}}
const save=()=>writeFile(ledgerPath,JSON.stringify(ledger),{mode:0o600});
const policyPath=option('--policy');const module=policyPath?await import(pathToFileURL(resolve(policyPath)).href):null;
if(module&&typeof module.createHarness!=='function')throw Error('Custom module must export createHarness(config).');
const brains=new Map<string,(turn:any)=>Promise<string>|string>();
const headers={'Content-Type':'application/json',Authorization:`Bearer ${credentials.token}`};
async function api(path:string,body?:unknown){const r=await fetch(new URL(path,base),{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15_000)});const d=await r.json();if(!r.ok)throw Error(`Arena ${r.status}: ${d.error}`);return d}
console.log(`Connected. Enter a challenge at ${base.origin}/agents/${credentials.agentId}. Press Ctrl+C to disconnect.`);
const lockPath=credentialsPath+'.lock';let lock;try{lock=await open(lockPath,'wx',0o600)}catch{throw Error('Another connection may be active. Stop it before reconnecting. A stale .lock file may be removed only after confirming the old process is gone.')}
let stopping=false;process.on('SIGINT',()=>{stopping=true});process.on('SIGTERM',()=>{stopping=true});
try{try{ledger=JSON.parse(await readFile(ledgerPath,'utf8'));if(!Number.isFinite(ledger.reserved)||!Number.isFinite(ledger.spent)||ledger.reserved<0||ledger.spent<0)throw Error('Invalid spend ledger')}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}while(!stopping){
 const {turns}=await api('/api/league?turns=1');
 for(const turn of turns){if(stopping)break;const config:HarnessConfig=Harness.parse(turn.config),candidates=harnessCandidates(turn,config,turn.seed+turn.historyUci.length*7919);let moveUci:string;
  if(config.brain==='model'){
   if(!process.env.OPENROUTER_API_KEY)throw Error('Set OPENROUTER_API_KEY locally for model builds.');
   if(ledger.spent+ledger.reserved+RESERVE_MICROS>budget*1e6)throw Error('Local model budget exhausted or unresolved charges reserved. Your games stay saved.');
   ledger.reserved+=RESERVE_MICROS;await save();
   const reply=await openRouterMove(config.model,{fen:turn.fen,historyUci:config.memory==='none'?[]:turn.historyUci.slice(config.memory==='recent'?-8:0),legalMoves:candidates.slice(0,8)},{apiKey:process.env.OPENROUTER_API_KEY,systemPrompt:config.prompt});
   if(reply.costMicros===null)throw Error('Unknown provider cost; reservation retained. Inspect your provider account before resuming.');
   ledger.reserved-=RESERVE_MICROS;ledger.spent+=reply.costMicros;await save();
   if(reply.costMicros>RESERVE_MICROS)throw Error('Provider exceeded per-call reservation. Stop and inspect billing.');
   if(reply.finishReason!=='stop')throw Error('Model did not finish its move.');moveUci=parseMove(reply.content,candidates.slice(0,8));
  }else{
   if(!module)throw Error('Pass --policy examples/custom-harness.mjs or your own module for custom builds.');
   if(!brains.has(turn.matchId))brains.set(turn.matchId,module.createHarness(config));
   moveUci=await brains.get(turn.matchId)!({...turn,candidates});
  }
  if(!turn.legalMoves.includes(moveUci))throw Error('Harness returned an illegal move. No fallback was used.');
  await api('/api/league',{action:'move',matchId:turn.matchId,version:turn.version,moveUci});
  console.log(`${turn.matchId.slice(0,8)} · ply ${turn.version+1} · ${moveUci} · ${base.origin}${turn.watchUrl}`);
 }
 await new Promise(r=>setTimeout(r,1000));
}
}finally{await lock.close();await unlink(lockPath)}
