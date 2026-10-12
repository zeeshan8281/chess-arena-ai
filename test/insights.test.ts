import test from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {materialBalance,moveFacts} from '../src/insights';
test('review reports board facts rather than inferred move quality',()=>{
 const c=new Chess();assert.equal(materialBalance(c),0);c.move('e4');c.move('d5');const m=c.move('exd5');assert.deepEqual(moveFacts(m,c),{tags:['Capture'],material:1,captured:'p'});
 const p=new Chess('7k/P7/8/8/8/8/8/6K1 w - - 0 1');const promotion=p.move('a8=Q+');assert.deepEqual(moveFacts(promotion,p).tags,['Check','Promotion']);
});
