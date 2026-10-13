import {Chess} from 'chess.js';
import {mkdir,writeFile} from 'node:fs/promises';
import {openRouterMove,parseMove,RESERVE_MICROS} from '../src/openrouter';
const apiKey=process.env.OPENROUTER_API_KEY;if(!apiKey)throw Error('OPENROUTER_API_KEY required');
const response=await fetch('https://openrouter.ai/api/v1/key',{headers:{Authorization:'Bearer '+apiKey}});if(!response.ok)throw Error('Cannot verify key spend');const {data}=await response.json();
if(typeof data.usage!=='number'||!Number.isFinite(data.usage)||data.usage+3*RESERVE_MICROS/1e6>5)throw Error('Cannot safely fit this test under the existing $5 total cap');
const cases=[{name:'Opening',fen:new Chess().fen()},{name:'Mate in one',fen:'7k/5Q2/6K1/8/8/8/8/8 w - - 0 1'},{name:'Capture hanging queen',fen:'4k3/8/8/3q4/4P3/8/8/4K3 w - - 0 1'}];
const results=[];let reserved=0;
for(const c of cases){const chess=new Chess(c.fen),legalMoves=chess.moves({verbose:true}).map(m=>m.from+m.to+(m.promotion??''));reserved+=RESERVE_MICROS;
 try{const reply=await openRouterMove('google/gemini-4-argon',{fen:c.fen,legalMoves,historyUci:[]},{apiKey,fetch:async (url,options)=>{const r=await fetch(url,options);if(!r.ok){const d=await r.clone().json();console.log(JSON.stringify({providerError:d.error?.message,details:d.error?.metadata?.raw}));}return r}});const move=parseMove(reply.content,legalMoves);const m=chess.move(move);const result={name:c.name,fen:c.fen,move,legal:true,checkmate:chess.isCheckmate(),captured:m.captured??null,model:reply.model,latencyMs:Math.round(reply.latencyMs),costMicros:reply.costMicros,inputTokens:reply.inputTokens,outputTokens:reply.outputTokens};results.push(result);console.log(JSON.stringify(result));if(reply.costMicros===null)break;
 }catch(e){results.push({name:c.name,error:e instanceof Error?e.message:String(e)});console.log(JSON.stringify(results.at(-1)));break}}
await mkdir('verification',{recursive:true});await writeFile('verification/argon-smoke.json',JSON.stringify({model:'google/gemini-4-argon',createdAt:new Date().toISOString(),keyUsageBefore:data.usage,maxReservedMicros:reserved,results},null,2)+'\n');
