import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import pg from 'pg';
import { DEFAULT_POSITION } from 'chess.js';
import { Referee } from './rules';
import { Store } from './store';

const connectionString=process.env.ARENA_TEST_DATABASE_URL;
if (!connectionString || new URL(connectionString).pathname !== '/arena_validation') throw new Error('Dedicated ARENA_TEST_DATABASE_URL required');
const pool=new pg.Pool({connectionString});
try {
  const store=new Store(pool); await store.init();
  const id=await store.create(DEFAULT_POSITION);
  const script=['e2e4','e7e5','f1c4','b8c6','d1h5','g8f6','h5f7'];
  const frames=[{seq:0,fen:DEFAULT_POSITION,moveUci:'',san:'Start',result:{kind:'ongoing',reason:'scripted_fixture'}}];
  for(const moveUci of script){
    const lease=(await store.claim(id,'scripted-validation-worker'))!;
    assert(lease);
    const event=await store.commitMove(lease,{attemptId:lease.attemptId,moveUci},{elapsedMs:1,limitMs:1000});
    const replay=new Referee(DEFAULT_POSITION,script.slice(0,event.seq));
    frames.push({...event,san:replay.chess.history().at(-1)!});
  }
  const snapshot=await store.snapshot(id); const replay=new Referee(snapshot.initial_fen,snapshot.moves);
  assert.equal(replay.outcome().kind,'win'); assert.equal(snapshot.cursor,7);
  const events=await store.eventsAfter(id,0); assert.equal(events.length,7);
  const demo={id,label:'Scripted validation fixture — not a model match',rankEligible:false,initialFen:DEFAULT_POSITION,frames,pgn:replay.pgn(),checks:{persistedMoves:7,persistedEvents:7,reconstructed:true}};
  await writeFile('data/demo.json',JSON.stringify(demo,null,2));
  await writeFile('data/demo.pgn',demo.pgn+'\n');
  console.log(JSON.stringify({matchId:id,...demo.checks,result:replay.outcome()}));
} finally {await pool.end();}
