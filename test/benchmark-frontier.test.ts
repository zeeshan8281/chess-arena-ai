import test from 'node:test';
import assert from 'node:assert/strict';
import {paretoFrontier} from '../src/benchmark-frontier';
test('frontier excludes slower equal-score policies and retains genuine trade-offs',()=>{
 const rows=[{id:'random',resource:.002,score:0},{id:'capture',resource:1.163,score:25},{id:'search',resource:111,score:100},{id:'model',resource:2336,score:100}];assert.deepEqual(paretoFrontier(rows).map(p=>p.id),['search','capture','random']);
});
test('zero API spend does not fabricate a trade-off; exact ties are preserved',()=>{
 assert.deepEqual(paretoFrontier([{id:'random',resource:0,score:0},{id:'search',resource:0,score:100},{id:'model',resource:.035,score:100}]).map(p=>p.id),['search']);
 assert.equal(paretoFrontier([{id:'a',resource:0,score:100},{id:'b',resource:0,score:100}]).length,2);
});
