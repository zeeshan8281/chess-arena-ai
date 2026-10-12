import {Chess} from 'chess.js';
import {z} from 'zod';
import {seededRandom,type Observation} from './evaluation';
export const Harness=z.object({
 brain:z.enum(['random','capture','search','model','custom']),
 depth:z.union([z.literal(1),z.literal(2)]).default(1),
 mateGuard:z.boolean().default(true),
 safety:z.boolean().default(false),
 center:z.boolean().default(false),
 memory:z.enum(['none','recent','full']).default('recent'),
 model:z.string().max(100).regex(/^[a-zA-Z0-9/_.:-]*$/).default(''),
 prompt:z.string().max(800).default('Choose the strongest legal move.'),
 label:z.string().trim().min(1).max(60),
 notes:z.string().max(240).default(''),
}).strict();
export type HarnessConfig=z.infer<typeof Harness>;
export const externalHarness=(c:HarnessConfig)=>c.brain==='model'||c.brain==='custom';
const values:Record<string,number>={p:100,n:320,b:330,r:500,q:900,k:0};
function material(c:Chess,color:string){return c.board().flat().reduce((v,p)=>v+(p?(p.color===color?1:-1)*values[p.type]:0),0)}
export function harnessCandidates(turn:Observation,config:HarnessConfig,seed:number){
 const c=new Chess(turn.fen),color=c.turn(),random=seededRandom(seed),history=config.memory==='none'?[]:turn.historyUci.slice(config.memory==='recent'?-8:0);
 const ranked=c.moves({verbose:true}).map(move=>{
  const uci=move.from+move.to+(move.promotion??'');c.move(move);
  let score=config.brain==='random'?0:config.brain==='capture'?(values[move.captured??'']??0):material(c,color);
  const mate=c.isCheckmate();
  if(config.mateGuard&&mate)score+=1_000_000;
  if(config.safety&&c.isAttacked(move.to,c.turn()))score-=values[move.promotion??move.piece]*.8;
  if(config.center){const file=move.to.charCodeAt(0)-97,rank=Number(move.to[1])-1;score+=(7-Math.abs(file-3.5)-Math.abs(rank-3.5))*12}
  if(config.memory!=='none'&&history.includes(uci))score-=35;
  if(config.brain==='search'&&config.depth===2&&!mate){let worst=Infinity;for(const reply of c.moves({verbose:true})){c.move(reply);worst=Math.min(worst,c.isCheckmate()?-1_000_000:material(c,color));c.undo()}if(worst!==Infinity)score+=worst-material(c,color)}
  c.undo();return {uci,score,tie:random()};
 });
 ranked.sort((a,b)=>b.score-a.score||a.tie-b.tie);
 return ranked.map(m=>m.uci);
}
export function harnessMove(turn:Observation,config:HarnessConfig,seed:number){const move=harnessCandidates(turn,config,seed)[0];if(!move)throw Error('No legal moves');return move}
export const CHALLENGES=[
 {id:'rookie',name:'First blood',opponent:'Random Walk',description:'Win a game against the random baseline. Two games, both colors.',reward:100,requirement:0,target:1,maxPlies:160},
 {id:'tactics',name:'Finish the job',opponent:'Mate in one',description:'Find the finishing move as White and Black. Clear both boards.',reward:150,requirement:1,target:2,maxPlies:1},
 {id:'rival',name:'Take the crown',opponent:'Capture First',description:'Beat the capture-first defender. Same opening, both colors.',reward:250,requirement:2,target:1,maxPlies:160},
] as const;
export const NPC:Record<string,HarnessConfig>={
 rookie:Harness.parse({brain:'random',mateGuard:false,memory:'none',label:'Random Walk'}),
 tactics:Harness.parse({brain:'random',mateGuard:false,memory:'none',label:'Training defender'}),
 rival:Harness.parse({brain:'capture',mateGuard:true,memory:'recent',label:'Capture First'}),
};
export const LEAGUE_PROTOCOL='harness-challenges-v1';
