import {Chess, DEFAULT_POSITION} from 'chess.js';
import {Referee, type Outcome} from './rules';

export const SUITE = {id:'public-regression-v1', seeds:[17,43,97,211], maxPlies:160, initialFen:DEFAULT_POSITION, opponent:'seeded-random-v1', rules:'arena-referee-v1', engine:'chess.js@1.4.0'} as const;
export type Observation={fen:string;legalMoves:string[];historyUci:string[];version:number};
export type Policy=(turn:Observation,random:()=>number)=>string|Promise<string>;
export type PolicyFactory=()=>Policy;
export function seededRandom(seed:number){let state=seed>>>0;return()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296}}
export const policies:Record<string,{label:string;create:PolicyFactory}>={
 'random-v1':{label:'Random · v1',create:()=>((turn,random)=>turn.legalMoves[Math.floor(random()*turn.legalMoves.length)])},
 'capture-v1':{label:'Capture first · v1',create:()=>((turn,random)=>{
  const values:Record<string,number>={p:1,n:3,b:3,r:5,q:9,k:0};
  const moves=new Chess(turn.fen).moves({verbose:true});
  const best=Math.max(...moves.map(m=>values[m.captured??'']??0));
  const choices=moves.filter(m=>(values[m.captured??'']??0)===best);
  const m=choices[Math.floor(random()*choices.length)];return m.from+m.to+(m.promotion??'');
 })}
};
export type EvaluationGame={seed:number;color:'w'|'b';result:Outcome;error:string|null;attemptedMove:string|null;plies:number;moves:string[];finalFen:string;pgn:string};
export type Evaluation={suite:typeof SUITE;policy:string;sourceHash:string|null;policySource:string;games:EvaluationGame[];totals:{wins:number;draws:number;losses:number;stopped:number;errors:number}};
export async function evaluatePolicy(policy:string,create:PolicyFactory,progress?:(done:number)=>void|Promise<void>,sourceHash:string|null=null):Promise<Evaluation>{
 const games:EvaluationGame[]=[];
 for(const seed of SUITE.seeds)for(const color of ['w','b'] as const){
  const referee=new Referee(),choose=create(),ownRandom=seededRandom(seed^0x9e3779b9),opponentRandom=seededRandom(seed);
  let error:string|null=null,attemptedMove:string|null=null;
  while(referee.outcome().kind==='ongoing'&&referee.moves.length<SUITE.maxPlies){
   const legalMoves=referee.legalUci();
   try{
    const move=referee.chess.turn()===color?await choose({fen:referee.chess.fen(),legalMoves:[...legalMoves],historyUci:[...referee.moves],version:referee.moves.length},ownRandom):legalMoves[Math.floor(opponentRandom()*legalMoves.length)];
    attemptedMove=typeof move==='string'?move:null;referee.play(move);attemptedMove=null;
   }catch(e){error=e instanceof Error?e.message:'Policy failed';break}
  }
  const outcome=referee.outcome();
  const result:Outcome=error?{kind:'pending_adjudication',reason:'policy_error'}:outcome.kind==='ongoing'?{kind:'pending_adjudication',reason:'ply_limit'}:outcome;
  for(const [key,value] of Object.entries({Event:SUITE.id,White:color==='w'?policy:SUITE.opponent,Black:color==='b'?policy:SUITE.opponent,Seed:String(seed),Termination:result.reason}))referee.chess.setHeader(key,value);
  games.push({seed,color,result,error,attemptedMove,plies:referee.moves.length,moves:[...referee.moves],finalFen:referee.chess.fen(),pgn:referee.pgn()});
  await progress?.(games.length);
 }
 const totals={wins:0,draws:0,losses:0,stopped:0,errors:0};
 for(const g of games){if(g.error)totals.errors++;else if(g.result.kind==='win')totals[g.result.winner===g.color?'wins':'losses']++;else if(g.result.kind==='draw')totals.draws++;else totals.stopped++}
 return {suite:SUITE,policy,sourceHash,policySource:create.toString(),games,totals};
}
