import test from 'node:test';
import assert from 'node:assert/strict';
import {Chess,DEFAULT_POSITION} from 'chess.js';
import {localMove} from '../src/agents';
import {openRouterMove,parseMove} from '../src/openrouter';
import {mutationAllowed} from '../src/http';
test('local search finds mate and both local policies return legal moves',()=>{
 const fen='r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4';
 assert.equal(localMove(fen,'local-search',()=>0),'h5f7');
 for(const id of ['local-search','local-random']){const chess=new Chess();const uci=localMove(DEFAULT_POSITION,id);assert.doesNotThrow(()=>chess.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]}));}
});
test('model replies require exact JSON and a legal move',()=>{
 assert.equal(parseMove('{"moveUci":"e2e4"}',['e2e4']),'e2e4');
 for(const content of ['{"moveUci":"e2e5"}','{"moveUci":"e2e4","extra":1}','```json\n{}\n```'])assert.throws(()=>parseMove(content,['e2e4']));
});
test('OpenRouter uses bounded single dispatch and records usage before move parsing',async()=>{
 let calls=0;
 const result=await openRouterMove('test/model',{fen:DEFAULT_POSITION,legalMoves:['e2e4'],historyUci:[]},{apiKey:'test',fetch:async(_url,init)=>{calls++;const b=JSON.parse(String(init?.body));assert.equal(b.max_tokens,1024);assert.equal(b.provider.allow_fallbacks,false);assert.equal(b.provider.require_parameters,true);assert.equal(b.provider.max_price.completion,10);assert.equal(b.response_format.type,'json_schema');assert.deepEqual(b.response_format.json_schema.schema.properties.moveUci.enum,['e2e4']);assert.equal(b.response_format.json_schema.strict,true);return Response.json({id:'request-1',model:'test/model',choices:[{finish_reason:'stop',message:{content:'{"moveUci":"e2e4"}'}}],usage:{cost:0.001,prompt_tokens:10,completion_tokens:8}})}});
 assert.equal(calls,1);assert.equal(result.costMicros,1000);assert.equal(parseMove(result.content,['e2e4']),'e2e4');
});
test('OpenRouter errors do not retry and oversized bodies fail closed',async()=>{
 let calls=0;await assert.rejects(openRouterMove('test/model',{fen:DEFAULT_POSITION,legalMoves:['e2e4'],historyUci:[]},{apiKey:'test',fetch:async()=>{calls++;return new Response('error',{status:500})}}),/HTTP 500/);assert.equal(calls,1);
 await assert.rejects(openRouterMove('test/model',{fen:DEFAULT_POSITION,legalMoves:['e2e4'],historyUci:[]},{apiKey:'test',fetch:async()=>new Response('x'.repeat(65537))}),/64 KiB/);
});
test('mutation guard rejects cross-origin and unauthenticated remote requests',()=>{
 const prior=process.env.ARENA_OPERATOR_TOKEN;process.env.ARENA_OPERATOR_TOKEN='test-secret';
 try{const req=(url:string,headers:Record<string,string>)=>new Request(url,{method:'POST',headers:{'content-type':'application/json',...headers}});
 assert.equal(Boolean(mutationAllowed(req('http://127.0.0.1:3217',{host:'127.0.0.1:3217',origin:'https://evil.example'}))),false);
 assert.equal(Boolean(mutationAllowed(req('https://arena.example',{host:'arena.example'}))),false);
 assert.equal(Boolean(mutationAllowed(req('https://arena.example',{host:'arena.example',origin:'https://arena.example',authorization:'Bearer test-secret'}))),true);
 }finally{if(prior===undefined)delete process.env.ARENA_OPERATOR_TOKEN;else process.env.ARENA_OPERATOR_TOKEN=prior;}
});

 test('GPT-4.1 routing omits unsupported reasoning parameters; Gemini explicitly disables reasoning',async()=>{
  for(const model of ['openai/gpt-4.1-mini','google/gemini-2.5-flash']) {
   await openRouterMove(model,{fen:DEFAULT_POSITION,legalMoves:['e2e4'],historyUci:[]},{apiKey:'test',fetch:async(_url,init)=>{
    const body=JSON.parse(String(init?.body));
    assert.deepEqual(body.reasoning,model.startsWith('google/')?{enabled:false}:undefined);
    return Response.json({choices:[{finish_reason:'stop',message:{content:'{"moveUci":"e2e4"}'}}],usage:{cost:0}});
   }});
  }
 });
