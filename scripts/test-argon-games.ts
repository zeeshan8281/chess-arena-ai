import {Chess} from 'chess.js';
import {writeFile,mkdir} from 'node:fs/promises';
import {openRouterMove,parseMove,RESERVE_MICROS} from '../src/openrouter';
const key=process.env.OPENROUTER_API_KEY;if(!key)throw Error('OPENROUTER_API_KEY required');
const r=await fetch('https://openrouter.ai/api/v1/key',{headers:{Authorization:'Bearer '+key}});if(!r.ok)throw Error('Cannot verify total spend');const {data}=await r.json();if(typeof data.usage!=='number'||!Number.isFinite(data.usage)||data.usage+0.50>5)throw Error('Test cannot fit under existing $5 total cap');
let chargedMicros=0;const games:any[]=[];const out={model:'google/gemini-4-argon',protocol:'local-argon-random-smoke-v1',keyUsageBefore:data.usage,budgetMicros:500000,chargedMicros,games};
await mkdir('verification',{recursive:true});const save=async()=>{out.chargedMicros=chargedMicros;await writeFile('verification/argon-games.json',JSON.stringify(out,null,2)+'\n')};
for(const color of ['w','b']){const chess=new Chess();let seed=17;const random=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296};const game:any={argonColor:color,moves:[],attempts:[],status:'running'};games.push(game);await save();
 try{for(let ply=0;ply<160&&!chess.isGameOver();ply++){const legalMoves=chess.moves({verbose:true}).map(m=>m.from+m.to+(m.promotion??''));let move:string;
 if(chess.turn()===color){if(chargedMicros+RESERVE_MICROS>500000)throw Error('Local test budget reached');chargedMicros+=RESERVE_MICROS;await save();const reply=await openRouterMove(out.model,{fen:chess.fen(),legalMoves,historyUci:game.moves},{apiKey:key});if(reply.costMicros!==null)chargedMicros+=reply.costMicros-RESERVE_MICROS;game.attempts.push({ply,costMicros:reply.costMicros,latencyMs:Math.round(reply.latencyMs),model:reply.model});await save();move=parseMove(reply.content,legalMoves);if(reply.costMicros===null)throw Error('Unknown cost; stop test');}
 else move=legalMoves[Math.floor(random()*legalMoves.length)];chess.move(move);game.moves.push(move);await save();if(ply%10===0)console.log(JSON.stringify({color,plies:game.moves.length,costUSD:chargedMicros/1e6}));}
 game.status=chess.isCheckmate()?'checkmate':chess.isDraw()?'draw':'move_limit';game.winner=chess.isCheckmate()?(chess.turn()==='w'?'b':'w'):null;
 }catch(e){game.status='stopped';game.error=e instanceof Error?e.message:String(e)}
 game.pgn=chess.pgn();await save();console.log(JSON.stringify({color,status:game.status,winner:game.winner,plies:game.moves.length,error:game.error}));if(game.status==='stopped')break;}
console.log(JSON.stringify({costUSD:chargedMicros/1e6,games:games.map(g=>({argonColor:g.argonColor,status:g.status,winner:g.winner,plies:g.moves.length}))}));
