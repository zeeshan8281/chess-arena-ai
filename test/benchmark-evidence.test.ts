import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Referee} from '../src/rules';
const summary=JSON.parse(readFileSync('public/benchmarks/summary.json','utf8'));
test('homepage benchmark charts match reproducible, legally replayable evidence',()=>{
 for(const row of summary.rows){const report=JSON.parse(readFileSync('public'+row.evidence,'utf8'));assert.deepEqual(report.suite,summary.suite);assert.equal(report.games.length,8);const totals={wins:0,draws:0,losses:0,stopped:0,errors:0};
 assert.equal(new Set(report.games.map((g:any)=>`${g.seed}:${g.color}`)).size,8);
 for(const g of report.games){assert.ok(summary.suite.seeds.includes(g.seed));assert.ok(['w','b'].includes(g.color));const ref=new Referee(summary.suite.initialFen,g.moves);assert.equal(ref.chess.fen(),g.finalFen);assert.equal(g.moves.length,g.plies);
 if(g.error){totals.errors++;continue}const actual=ref.outcome();if(actual.kind==='ongoing'){assert.equal(g.plies,summary.suite.maxPlies);assert.equal(g.result.kind,'pending_adjudication');totals.stopped++}else{assert.deepEqual(g.result,actual);if(actual.kind==='draw')totals.draws++;else if(actual.kind==='win')totals[actual.winner===g.color?'wins':'losses']++}}
 assert.deepEqual(report.totals,totals);for(const key of Object.keys(totals) as (keyof typeof totals)[])assert.equal(row[key],totals[key]);assert.ok(row.medianMs>=0&&row.p95Ms>=row.medianMs);assert.equal(Object.values(totals).reduce((a,b)=>a+b),row.games);
 }
});
