import test from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {evaluatePolicy,policies,SUITE} from '../src/evaluation';
test('public regression is reproducible, color-balanced and exports valid game evidence',async()=>{
 const first=await evaluatePolicy('random-v1',policies['random-v1'].create),second=await evaluatePolicy('random-v1',policies['random-v1'].create);
 assert.deepEqual(first,second);assert.equal(first.games.length,8);
 assert.equal(Object.values(first.totals).reduce((a,b)=>a+b,0),8);
 for(const seed of SUITE.seeds)assert.deepEqual(first.games.filter(g=>g.seed===seed).map(g=>g.color),['w','b']);
 for(const game of first.games){const chess=new Chess();chess.loadPgn(game.pgn);assert.equal(chess.fen(),game.finalFen);assert.equal(game.moves.length,game.plies);if(game.plies===SUITE.maxPlies&&game.result.reason==='ply_limit')assert.equal(game.result.kind,'pending_adjudication')}
});
test('invalid moves are explicit errors, never losses or draws, and state resets each game',async()=>{
 let factories=0;const report=await evaluatePolicy('broken',()=>{factories++;return()=> 'e2e4garbage'});
 assert.equal(factories,8);assert.equal(report.totals.errors,8);assert.equal(report.totals.losses,0);assert.equal(report.totals.draws,0);assert.ok(report.games.every(g=>g.error&&g.result.reason==='policy_error'&&g.attemptedMove==='e2e4garbage'&&g.pgn.endsWith('*')));
});
