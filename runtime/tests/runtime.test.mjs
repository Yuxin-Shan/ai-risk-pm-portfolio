import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server.mjs';
import { Store } from '../store.mjs';
import { configFromEnv } from '../engine.mjs';
const config = { configured:true, endpoint:'https://model.invalid/v1/chat/completions',apiKey:'test-only',model:'protocol-test-double',timeoutMs:500,totalMs:2000,maxRounds:4,maxCalls:8 };
const completion = (content, calls=[]) => new Response(JSON.stringify({choices:[{finish_reason:'stop',message:{role:'assistant',content,tool_calls:calls}}],usage:{prompt_tokens:10,completion_tokens:10,total_tokens:20}}));
const call = (name,args='{}') => ({id:'call-1',type:'function',function:{name,arguments:args}});
function mock() {
  return async (_url,options) => {
    const body = JSON.parse(options.body);
    const tool = body.messages.findLast(m => m.role === 'tool');
    if(tool) return completion('模拟模型替身结论，证据：'+JSON.parse(tool.content).sourceId);
    return completion(null,body.tools.map((tool,i)=>({...call(tool.function.name),id:'call-'+i})));
  };
}
async function fixture(t,fetcher=mock(),overrides={}) {
  const app=createApp({dbPath:':memory:',config:{...config,...overrides},fetcher});
  await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
  t.after(()=>app.close());
  const base='http://127.0.0.1:'+app.server.address().port;
  const boot=await(await fetch(base+'/api/bootstrap')).json();
  const request=async(path,body,headers={})=>{
    const response=await fetch(base+path,body===undefined?{headers}:{method:'POST',headers:{'content-type':'application/json','x-runtime-token':boot.token,...headers},body:JSON.stringify(body)});
    return {status:response.status,data:await response.json()};
  };
  const create=async(agentId='investigator',targetId='SIM-CASE-001')=>(await request('/api/runs',{agentId,targetId,prompt:'核查对象并引用证据'})).data;
  const approve=run=>request('/api/runs/'+run.id+'/approve',{packageId:run.packageId});
  const done=async id=>{
    for(let i=0;i<200;i++){const r=app.store.get(id);if(!['queued','running'].includes(r.status))return r;await new Promise(r=>setTimeout(r,10));}
    throw new Error('test timeout');
  };
  return {app,base,request,create,approve,done};
}
test('no model call before approval; wrong package cannot start',async t=>{
  let n=0;const f=await fixture(t,async(...args)=>{n++;return mock()(...args);});
  const run=await f.create();assert.equal(run.status,'awaiting_approval');
  assert.equal((await f.request('/api/runs/'+run.id+'/approve',{packageId:'wrong'})).status,409);
  assert.equal(n,0);assert.equal(f.app.store.events(run.id).filter(e=>e.kind==='tool_result').length,0);
});
test('three roles perform tool round trips; final report cites actual tool response',async t=>{
  const f=await fixture(t);
  const first=await f.create();assert.equal((await f.approve(first)).status,200);
  assert.equal((await f.done(first.id)).status,'succeeded');
  for(const agent of ['evaluator','analyst']){
    const run=await f.create(agent,first.id);await f.approve(run);
    assert.equal((await f.done(run.id)).status,'succeeded');
    assert.equal(f.app.store.events(run.id).filter(e=>e.kind==='tool_result').length,2);
  }
});
test('missing model configuration cannot execute',async t=>{
  const f=await fixture(t,mock(),{configured:false});const run=await f.create();
  assert.equal((await f.approve(run)).data.error,'MODEL_NOT_CONFIGURED');
  assert.equal(f.app.store.get(run.id).status,'awaiting_approval');
});
test('unauthorized tool is blocked before executing',async t=>{
  const f=await fixture(t,async()=>completion(null,[call('get_events')]));
  const run=await f.create();await f.approve(run);
  assert.equal((await f.done(run.id)).error,'TOOL_NOT_AUTHORIZED');
  assert.ok(f.app.store.events(run.id).some(e=>e.kind==='tool_blocked'));
  assert.equal(f.app.store.events(run.id).filter(e=>e.kind==='tool_result').length,0);
});
test('extra arguments cannot redirect case scope',async t=>{
  const f=await fixture(t,async()=>completion(null,[call('get_case','{"caseId":"another"}')]));
  const run=await f.create();await f.approve(run);assert.equal((await f.done(run.id)).error,'INVALID_TOOL_ARGUMENTS');
});
test('unsupported or plain chat model cannot fake tool success',async t=>{
  const f=await fixture(t,async()=>completion('已经调查完成'));
  const run=await f.create();await f.approve(run);assert.equal((await f.done(run.id)).error,'NO_TOOL_EVIDENCE');
});
test('missing synthetic data remains needs_human with output preserved',async t=>{
  const f=await fixture(t,async(_u,o)=>{
    const b=JSON.parse(o.body),tool=b.messages.findLast(m=>m.role==='tool');
    return tool?completion('数据缺失，请人工核查，证据：'+JSON.parse(tool.content).sourceId):completion(null,b.tools.map((tool,i)=>({...call(tool.function.name),id:'call-'+i})));
  });
  const run=await f.create('investigator','SIM-CASE-003');await f.approve(run);
  const result=await f.done(run.id);assert.equal(result.status,'needs_human');assert.equal(result.error,'MISSING_SOURCE_DATA');assert.ok(result.output);
});
test('HTTP failure is retained without exposing provider error body',async t=>{
  const f=await fixture(t,async()=>new Response('SECRET_PROVIDER_BODY',{status:401}));
  const run=await f.create();await f.approve(run);assert.equal((await f.done(run.id)).error,'MODEL_HTTP_401');
  assert.ok(!JSON.stringify(f.app.store.events(run.id)).includes('SECRET_PROVIDER_BODY'));
});
const hang=async(_u,{signal})=>new Promise((_,reject)=>{if(signal.aborted)return reject(signal.reason);signal.addEventListener('abort',()=>reject(signal.reason),{once:true});});
test('timeout goes to human and cancellation cannot later become success',async t=>{
  const f=await fixture(t,hang,{timeoutMs:20});let run=await f.create();await f.approve(run);
  assert.equal((await f.done(run.id)).error,'MODEL_TIMEOUT');
  run=await f.create();await f.approve(run);await f.request('/api/runs/'+run.id+'/cancel',{});
  assert.equal((await f.done(run.id)).status,'cancelled');
});
test('round budget terminates repeated tool calls',async t=>{
  const f=await fixture(t,async()=>completion(null,[call('get_case')]),{maxRounds:2});
  const run=await f.create();await f.approve(run);assert.equal((await f.done(run.id)).error,'ROUND_BUDGET_EXCEEDED');
});
test('human resolution requires terminal state and can be written once',async t=>{
  const f=await fixture(t);const run=await f.create();const path='/api/runs/'+run.id+'/resolve';
  const data={decision:'manual_review',note:'需要人工复核'};
  assert.equal((await f.request(path,data)).status,409);
  await f.approve(run);await f.done(run.id);
  assert.equal((await f.request(path,data)).status,200);assert.equal((await f.request(path,data)).status,409);
  assert.equal(f.app.store.events(run.id).filter(e=>e.kind==='human_resolution').length,1);
});
test('cross-origin, missing token, secrets and path traversal rejected; prototype available',async t=>{
  const f=await fixture(t);
  assert.equal((await f.request('/api/runs',{}, {'x-runtime-token':'bad'})).status,403);
  assert.equal((await f.request('/api/runs',{}, {origin:'https://evil.invalid'})).status,403);
  for(const path of ['/.env','/../server.mjs','/prototype/%2e%2e%2fruntime%2f.env','/prototype/../runtime/server.mjs'])assert.equal((await fetch(f.base+path)).status,404);
  assert.equal((await fetch(f.base+'/')).status,200);
  assert.equal((await fetch(f.base+'/prototype/samples/sample-dialog.html')).status,200);
});
test('persistence preserves evidence and restart marks interrupted tasks',()=>{
  const dir=mkdtempSync(join(tmpdir(),'risk-runtime-test-')),path=join(dir,'db.sqlite');
  try{
    let s=new Store(path);const run=s.create('investigator','SIM-CASE-001','test');
    s.patch(run.id,{status:'running'});s.event(run.id,'tool_result',{name:'get_case'});s.close();
    s=new Store(path);assert.equal(s.get(run.id).error,'PROCESS_RESTARTED');assert.equal(s.events(run.id).filter(e=>e.kind==='tool_result').length,1);s.close();
  }finally{rmSync(dir,{recursive:true,force:true});}
});
test('configuration requires secure URL and all model settings',()=>{
  assert.equal(configFromEnv({}).configured,false);
  assert.throws(()=>configFromEnv({LLM_BASE_URL:'http://remote.example/v1'}));
  assert.throws(()=>configFromEnv({LLM_BASE_URL:'https://user:password@remote.example/v1'}));
  assert.equal(configFromEnv({LLM_BASE_URL:'https://example.com/v1/',LLM_MODEL:'x',LLM_API_KEY:'key'}).endpoint,'https://example.com/v1/chat/completions');
});
