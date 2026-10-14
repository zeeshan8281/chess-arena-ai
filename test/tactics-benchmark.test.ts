import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {Chess} from 'chess.js';
import {positionTurn,wilson,reserveAttempt,settleAttempt,responseFailure} from '../src/tactics-benchmark';
const fixture=JSON.parse(readFileSync('public/benchmarks/tactics/positions.json','utf8'));
test('tactics fixture applies the opponent move, has balanced bands, and legal solution continuations',()=>{assert.equal(fixture.positions.length,32);assert.equal(new Set(fixture.positions.map((p:any)=>p.id)).size,32);for(const [band] of fixture.bands)assert.equal(fixture.positions.filter((p:any)=>p.band===band).length,8);for(const p of fixture.positions){const turn=positionTurn(p.fenBefore,p.line);assert.notEqual(turn.fen,p.fenBefore);assert.ok(turn.legalMoves.includes(p.line[1]));const c=new Chess(p.fenBefore);for(const m of p.line)c.move({from:m.slice(0,2),to:m.slice(2,4),promotion:m[4]});}});
test('Wilson uncertainty does not call perfect small samples certain',()=>{const perfect=wilson(8,8);assert.ok(Math.abs(perfect.low-.6756)<.001);assert.ok(perfect.high<=1);const zero=wilson(0,8);assert.ok(zero.high>.32&&zero.high<.33);const middle=wilson(16,32);assert.ok(middle.low<.5&&middle.high>.5);});
test('recorded tactics outcomes and bands match per-position evidence',()=>{const path='public/benchmarks/tactics/summary.json';assert.ok(existsSync(path),'Run benchmark first');const summary=JSON.parse(readFileSync(path,'utf8'));for(const row of summary.rows){const report=JSON.parse(readFileSync('public'+row.evidence,'utf8'));assert.equal(report.cases.length,32);assert.equal(new Set(report.cases.map((c:any)=>c.id)).size,32);let correct=0,errors=0;for(const c of report.cases){const p=fixture.positions.find((p:any)=>p.id===c.id);assert.ok(p);assert.equal(c.expected,p.line[1]);assert.equal(c.band,p.band);if(c.attempted)assert.equal(c.fen,positionTurn(p.fenBefore,p.line).fen);assert.equal(c.correct,c.move===p.line[1]);if(c.move)assert.ok(positionTurn(p.fenBefore,p.line).legalMoves.includes(c.move));if(c.correct)correct++;if(c.error)errors++;}assert.equal(row.attempted,report.cases.filter((c:any)=>c.attempted).length);assert.equal(row.complete,row.attempted===32);assert.equal(row.successes,correct);assert.equal(row.errors,errors);assert.equal(row.accuracy,correct/32);assert.deepEqual(row.interval,wilson(correct,32));assert.equal(row.bands.reduce((n:number,b:any)=>n+b.successes,0),correct);assert.equal(row.costMicros,report.cases.reduce((n:number,c:any)=>n+c.costMicros,0));}});

test('ambiguous billed failures retain reservations and prevent an over-budget request',async()=>{
 let reserved=0,calls=0;
 const provider=async()=>{calls++;throw new Error('Provider response missed deadline')};
 async function attempt(){reserved=reserveAttempt(reserved,100000,50000);try{await provider()}catch(error){assert.equal(responseFailure(error).kind,'timeout');reserved=settleAttempt(reserved,50000,null)}}
 await attempt();await attempt();await assert.rejects(attempt,/Budget exhausted/);assert.equal(calls,2);assert.equal(reserved,100000);
});
test('known billing releases only unused reservation; malformed answers remain billable',()=>{
 let reserved=reserveAttempt(0,50000,50000);reserved=settleAttempt(reserved,50000,1234);assert.equal(reserved,1234);
 assert.equal(responseFailure(new Error('Model returned malformed move JSON')).kind,'invalid_response');
 assert.equal(responseFailure(new Error('Missing model response content')).kind,'invalid_response');
 assert.equal(responseFailure(new Error('Model returned an illegal move')).kind,'illegal_move');
 assert.equal(responseFailure(new Error('OpenRouter HTTP 503')).stop,false);
 assert.equal(responseFailure(new Error('OpenRouter HTTP 408')).stop,false);
 assert.equal(responseFailure(new Error('OpenRouter HTTP 401')).stop,true);
 assert.equal(responseFailure(new Error('Unknown billing cost')).stop,true);
 assert.throws(()=>settleAttempt(reserved,50000,-1),/Invalid billing/);
 assert.throws(()=>reserveAttempt(0,50000,NaN),/Invalid budget/);
});

test('continuations preserve every previously attempted outcome',()=>{const summary=JSON.parse(readFileSync('public/benchmarks/tactics/summary.json','utf8'));for(const row of summary.rows){const report=JSON.parse(readFileSync('public'+row.evidence,'utf8'));if(!report.priorEvidence)continue;const prior=JSON.parse(readFileSync('public'+report.priorEvidence,'utf8'));for(const c of prior.cases.filter((c:any)=>c.attempted))assert.deepEqual(report.cases.find((next:any)=>next.id===c.id),c);}});
