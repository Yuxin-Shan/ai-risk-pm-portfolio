#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';

const parseArgs = argv => {
  const result={};
  for(let index=0;index<argv.length;index+=2){
    const key=argv[index];
    if(!key?.startsWith('--')||argv[index+1]===undefined)throw new Error(`invalid argument near ${key||'<end>'}`);
    result[key.slice(2)]=argv[index+1];
  }
  return result;
};

const args=parseArgs(process.argv.slice(2));
for(const key of ['browser','manifest','page'])if(!args[key])throw new Error(`missing --${key}`);
if(!fs.existsSync(args.browser))throw new Error(`browser not found: ${args.browser}`);
if(!fs.existsSync(args.manifest))throw new Error(`manifest not found: ${args.manifest}`);

const manifest=JSON.parse(fs.readFileSync(args.manifest,'utf8'));
if(!Array.isArray(manifest.cases))throw new Error('manifest.cases must be an array');
const ids=new Set();
for(const item of manifest.cases){
  if(!item.id||!item.category)throw new Error('every case requires id and category');
  if(ids.has(item.id))throw new Error(`duplicate case id: ${item.id}`);
  ids.add(item.id);
}
const byCategory=Object.groupBy(manifest.cases,item=>item.category);
if((byCategory.transition||[]).length!==24)throw new Error('manifest must contain 24 transition cases');
if((byCategory.url||[]).length!==10)throw new Error('manifest must contain 10 URL cases');
const transitionNames=(byCategory.transition||[]).map(item=>item.event?.type);
if(new Set(transitionNames).size!==24)throw new Error('transition event names must be unique');

const userDataDir=fs.mkdtempSync(path.join(os.tmpdir(),'p0-dialog-cdp-'));
const browser=spawn(args.browser,[
  '--headless','--no-sandbox','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1',
  '--window-size=1200,960','--remote-debugging-port=0',`--user-data-dir=${userDataDir}`,'about:blank'
],{stdio:['ignore','ignore','pipe']});

let stderr='';
const endpoint=await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error(`DevTools endpoint timeout\n${stderr}`)),10000);
  browser.stderr.setEncoding('utf8');
  browser.stderr.on('data',chunk=>{
    stderr+=chunk;
    const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
    if(match){clearTimeout(timer);resolve(match[1]);}
  });
  browser.once('exit',code=>{clearTimeout(timer);reject(new Error(`browser exited before DevTools endpoint: ${code}\n${stderr}`));});
});

class CdpClient {
  constructor(url){
    this.socket=new WebSocket(url);this.nextId=1;this.pending=new Map();this.listeners=new Map();
  }
  async open(){
    if(this.socket.readyState===WebSocket.OPEN)return;
    await new Promise((resolve,reject)=>{this.socket.addEventListener('open',resolve,{once:true});this.socket.addEventListener('error',reject,{once:true});});
    this.socket.addEventListener('message',event=>{
      const message=JSON.parse(event.data);
      if(message.id){
        const waiter=this.pending.get(message.id);if(!waiter)return;this.pending.delete(message.id);
        if(message.error)waiter.reject(new Error(`${waiter.method}: ${message.error.message}`));else waiter.resolve(message.result);
        return;
      }
      for(const listener of this.listeners.get(message.method)||[])listener(message.params||{},message.sessionId);
    });
  }
  send(method,params={},sessionId){
    const id=this.nextId++;
    return new Promise((resolve,reject)=>{this.pending.set(id,{resolve,reject,method});this.socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});
  }
  on(method,listener){const current=this.listeners.get(method)||[];current.push(listener);this.listeners.set(method,current);}
  close(){this.socket.close();}
}

const cdp=new CdpClient(endpoint);
await cdp.open();
const {targetId}=await cdp.send('Target.createTarget',{url:'about:blank'});
const {sessionId}=await cdp.send('Target.attachToTarget',{targetId,flatten:true});
for(const method of ['Page.enable','Runtime.enable','Network.enable','Log.enable'])await cdp.send(method,{},sessionId);
await cdp.send('Emulation.setDeviceMetricsOverride',{width:1200,height:960,deviceScaleFactor:1,mobile:false},sessionId);

const consoleErrors=[];
const externalRequests=[];
const failedRequests=[];
cdp.on('Runtime.exceptionThrown',params=>consoleErrors.push(params.exceptionDetails?.text||'Runtime.exceptionThrown'));
cdp.on('Runtime.consoleAPICalled',params=>{if(['error','assert'].includes(params.type))consoleErrors.push(params.args?.map(arg=>arg.value||arg.description||'').join(' ')||params.type);});
cdp.on('Log.entryAdded',params=>{if(params.entry?.level==='error')consoleErrors.push(params.entry.text||'Log.entryAdded');});
cdp.on('Network.requestWillBeSent',params=>{if(/^https?:/i.test(params.request?.url||''))externalRequests.push(params.request.url);});
cdp.on('Network.loadingFailed',params=>failedRequests.push(`${params.errorText||'loadingFailed'}:${params.requestId}`));

const evaluate=async expression=>{
  const result=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);
  if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text||'evaluation failed');
  return result.result.value;
};
const sleep=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
const withDemo=query=>{
  const url=new URL(args.page);
  const params=new URLSearchParams(query?.startsWith('?')?query.slice(1):query||'');
  params.set('demo-controls','1');url.search=params.toString();return url.href;
};
const navigate=async(query='',metrics={width:1200,height:960})=>{
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:metrics.width,height:metrics.height,deviceScaleFactor:1,mobile:false},sessionId);
  await cdp.send('Page.navigate',{url:withDemo(query)},sessionId);
  const deadline=Date.now()+8000;
  while(Date.now()<deadline){
    try{if(await evaluate('document.readyState==="complete" && Boolean(window.__sampleTest)'))break;}catch{}
    await sleep(25);
  }
  if(!(await evaluate('document.readyState==="complete" && Boolean(window.__sampleTest)')))throw new Error('page/test API did not become ready');
  await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
};
const getPath=(value,dotted)=>dotted.split('.').reduce((current,key)=>current==null?undefined:current[key],value);
const assertExpected=(actual,expect={},includes={})=>{
  for(const [key,value] of Object.entries(expect)){
    const found=getPath(actual,key);
    if(!Object.is(found,value))throw new Error(`${key}: expected ${JSON.stringify(value)}, received ${JSON.stringify(found)}`);
  }
  for(const [key,value] of Object.entries(includes)){
    const found=getPath(actual,key);
    if(!Array.isArray(found)||!found.includes(value))throw new Error(`${key}: expected to include ${JSON.stringify(value)}, received ${JSON.stringify(found)}`);
  }
};
const stateSnapshot=async()=>evaluate(`(()=>{const root=document.documentElement;return {url:location.href,sessionPhase:root.dataset.sessionPhase,runState:root.dataset.runState,workspaceMode:root.dataset.workspaceMode,degraded:root.dataset.degraded,theme:root.dataset.theme,activeElement:document.activeElement?.id||document.activeElement?.getAttribute('data-output-open')||document.activeElement?.className||document.activeElement?.tagName,state:window.__sampleTest?.getState()};})()`);
const waitFrames="await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))";
const setPrompt=`const prompt=document.querySelector('#prompt');const setPrompt=value=>{prompt.value=value;prompt.dispatchEvent(new Event('input',{bubbles:true}));}`;

const runTransition=async item=>{
  await navigate(item.from);
  const actual=await evaluate(`(()=>{let state=window.__sampleTest.getState();for(const event of ${JSON.stringify(item.setupEvents||[])})state=window.__sampleTest.reduce(state,event);return window.__sampleTest.reduce(state,${JSON.stringify(item.event)});})()`);
  assertExpected(actual,item.expect,item.includes);
};
const runUrl=async item=>{
  await navigate(item.query);
  const actual=await evaluate(`(()=>{const root=document.documentElement;return {theme:root.dataset.theme,sessionPhase:root.dataset.sessionPhase,runState:root.dataset.runState,workspaceMode:root.dataset.workspaceMode,degraded:root.dataset.degraded,indicator:document.querySelector('#run-indicator-text')?.textContent};})()`);
  assertExpected(actual,item.expect);
};
const runIndicator=async item=>{
  await navigate(item.query);
  if(item.setupEvents?.length)await evaluate(`(async()=>{for(const event of ${JSON.stringify(item.setupEvents)})window.__sampleTest.dispatch(event);${waitFrames};})()`);
  const actual=await evaluate(`(()=>({label:document.querySelector('#run-indicator-text')?.textContent,tone:[...document.querySelector('#run-indicator').classList].find(name=>name!=='run-indicator')}))()`);
  assertExpected(actual,item.expect);
};
const runRail=async item=>{
  await navigate(item.query);
  const actual=await evaluate('window.__sampleTest.railModel(window.__sampleTest.getState())');
  assertExpected(actual,item.expect);
  const dom=await evaluate(`(()=>({liveSteps:document.querySelectorAll('[data-live-steps]').length,capabilityFacts:document.querySelectorAll('[data-capability-facts]').length,overflow:document.querySelector('#objects').scrollWidth-document.querySelector('#objects').clientWidth}))()`);
  if(dom.liveSteps!==(actual.steps.length?1:0))throw new Error(`live steps DOM mismatch: ${JSON.stringify(dom)}`);
  if(dom.capabilityFacts!==1||dom.overflow>0)throw new Error(`rail DOM contract failed: ${JSON.stringify(dom)}`);
};

const runInputFocus=async item=>{
  const operation=item.operation;
  const base=['new-autofocus','blank-submit','first-submit-preserves-text','enter-submit','shift-enter-newline','ime-enter-no-submit'].includes(operation)?'?state=empty':
    ['accepting-resubmit','plan-focus-empty-draft','plan-does-not-steal-draft','plan-does-not-steal-composition'].includes(operation)?'?state=loading':
    ['confirm-focus-summary','cancel-focus-prompt','edit-focus-field'].includes(operation)?'?state=confirm':'?state=normal';
  await navigate(base,operation==='right-drawer-focus-trap'?{width:900,height:960}:{width:1200,height:960});
  const result=await evaluate(`(async()=>{${setPrompt};const raf=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));switch(${JSON.stringify(operation)}){
    case 'new-autofocus':await raf();return {active:document.activeElement?.id};
    case 'blank-submit':setPrompt('   ');document.querySelector('#composer').requestSubmit();await raf();return {runState:document.documentElement.dataset.runState,messages:document.querySelectorAll('[data-user-message]').length,value:prompt.value,notice:document.querySelector('#toast').textContent,active:document.activeElement?.id};
    case 'first-submit-preserves-text':setPrompt('核对本周策略效果');document.querySelector('#composer').requestSubmit();await raf();return {runState:document.documentElement.dataset.runState,messages:document.querySelectorAll('[data-user-message]').length,value:prompt.value};
    case 'accepting-resubmit':setPrompt('补充高风险样本');document.querySelector('#composer').requestSubmit();await raf();return {runState:document.documentElement.dataset.runState,messages:window.__sampleTest.getState().messages.length,value:prompt.value};
    case 'plan-focus-empty-draft':window.__sampleTest.dispatch({type:'SET_DRAFT',value:''});prompt.focus();window.__sampleTest.dispatch({type:'ACCEPTING_COMPLETE'});await raf();return {active:document.activeElement?.id,runState:document.documentElement.dataset.runState};
    case 'plan-does-not-steal-draft':window.__sampleTest.dispatch({type:'SET_DRAFT',value:'尚未提交的草稿'});prompt.focus();window.__sampleTest.dispatch({type:'ACCEPTING_COMPLETE'});await raf();return {active:document.activeElement?.id,value:prompt.value};
    case 'plan-does-not-steal-composition':window.__sampleTest.dispatch({type:'SET_DRAFT',value:''});window.__sampleTest.dispatch({type:'SET_COMPOSING',value:true});prompt.focus();window.__sampleTest.dispatch({type:'ACCEPTING_COMPLETE'});await raf();return {active:document.activeElement?.id,composing:window.__sampleTest.getState().ui.composing};
    case 'confirm-focus-summary':window.__sampleTest.dispatch({type:'CONFIRM_PLAN',via:'button'});await raf();return {active:document.activeElement?.id,runState:document.documentElement.dataset.runState};
    case 'cancel-focus-prompt':window.__sampleTest.dispatch({type:'CANCEL_PLAN'});await raf();return {active:document.activeElement?.id,runState:document.documentElement.dataset.runState};
    case 'edit-focus-field':window.__sampleTest.dispatch({type:'EDIT_PLAN',mode:'open'});await raf();return {active:document.activeElement?.id,editing:window.__sampleTest.getState().ui.editingPlan};
    case 'enter-submit':setPrompt('核对本周策略效果');prompt.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true,cancelable:true}));await raf();return {runState:document.documentElement.dataset.runState,messages:document.querySelectorAll('[data-user-message]').length};
    case 'shift-enter-newline':{setPrompt('第一行');const keyEvent=new KeyboardEvent('keydown',{key:'Enter',code:'Enter',shiftKey:true,bubbles:true,cancelable:true});prompt.dispatchEvent(keyEvent);if(!keyEvent.defaultPrevented){prompt.setRangeText('\\n',prompt.selectionStart,prompt.selectionEnd,'end');prompt.dispatchEvent(new Event('input',{bubbles:true}));}return {prevented:keyEvent.defaultPrevented,value:prompt.value,runState:document.documentElement.dataset.runState};}
    case 'ime-enter-no-submit':{setPrompt('拼音输入');prompt.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true,data:'pin'}));const keyEvent=new KeyboardEvent('keydown',{key:'Enter',code:'Enter',isComposing:true,bubbles:true,cancelable:true});prompt.dispatchEvent(keyEvent);await raf();return {runState:document.documentElement.dataset.runState,messages:document.querySelectorAll('[data-user-message]').length,composing:window.__sampleTest.getState().ui.composing};}
    case 'output-open-focus-title':window.__sampleTest.dispatch({type:'OPEN_OUTPUT',outputId:'plan-snapshot'});await raf();return {active:document.activeElement?.id,mode:document.documentElement.dataset.workspaceMode};
    case 'output-escape-focus-return':document.querySelector('[data-output-open="plan-snapshot"]').click();await raf();document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));await new Promise(resolve=>setTimeout(resolve,80));await raf();return {mode:document.documentElement.dataset.workspaceMode,active:document.activeElement?.getAttribute('data-output-open')||document.activeElement?.id};
    case 'right-drawer-focus-trap':{const button=document.querySelector('.objects-toggle');button.click();await raf();const panel=document.querySelector('#objects');const opened=!panel.hasAttribute('inert');const items=[...panel.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')];const first=items[0],last=items.at(-1);last.focus();last.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));const trapped=document.activeElement===first;document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));await raf();return {opened,trapped,closed:panel.hasAttribute('inert'),returned:document.activeElement===button};}
    default:throw new Error('unknown input operation');
  }})()`);
  const expected={
    'new-autofocus':{active:'prompt'},
    'blank-submit':{runState:'idle',messages:0,value:'   ',notice:'请输入需求',active:'prompt'},
    'first-submit-preserves-text':{runState:'accepting',messages:1,value:'核对本周策略效果'},
    'accepting-resubmit':{runState:'accepting',messages:1,value:'补充高风险样本'},
    'plan-focus-empty-draft':{active:'plan-title',runState:'awaitingConfirm'},
    'plan-does-not-steal-draft':{active:'prompt',value:'尚未提交的草稿'},
    'plan-does-not-steal-composition':{active:'prompt',composing:true},
    'confirm-focus-summary':{active:'plan-summary',runState:'running'},
    'cancel-focus-prompt':{active:'prompt',runState:'cancelled'},
    'edit-focus-field':{active:'plan-scope',editing:true},
    'enter-submit':{runState:'accepting',messages:1},
    'shift-enter-newline':{prevented:false,value:'第一行\n',runState:'idle'},
    'ime-enter-no-submit':{runState:'idle',messages:0,composing:true},
    'output-open-focus-title':{active:'output-title',mode:'outputViewer'},
    'output-escape-focus-return':{mode:'conversation',active:'plan-snapshot'},
    'right-drawer-focus-trap':{opened:true,trapped:true,closed:true,returned:true}
  }[operation];
  assertExpected(result,expected);
  if(operation==='right-drawer-focus-trap')await cdp.send('Emulation.setDeviceMetricsOverride',{width:1200,height:960,deviceScaleFactor:1,mobile:false},sessionId);
};

const waitForMode=async mode=>{
  const deadline=Date.now()+3000;
  while(Date.now()<deadline){if(await evaluate(`document.documentElement.dataset.workspaceMode===${JSON.stringify(mode)}`))return;await sleep(20);}
  throw new Error(`workspace mode did not become ${mode}`);
};
const runHistory=async item=>{
  switch(item.operation){
    case 'open-output-preserves-query':{
      await navigate('?theme=light&state=normal');
      const result=await evaluate(`(()=>{window.__sampleTest.dispatch({type:'OPEN_OUTPUT',outputId:'plan-snapshot'});const q=new URLSearchParams(location.search);return {theme:q.get('theme'),state:q.get('state'),mode:q.get('mode'),output:q.get('output'),demo:q.get('demo-controls')};})()`);
      assertExpected(result,{theme:'light',state:'normal',mode:'output',output:'plan-snapshot',demo:'1'});break;
    }
    case 'back-closes-output':{
      await navigate('?theme=light&state=normal');
      await evaluate(`window.__sampleTest.dispatch({type:'OPEN_OUTPUT',outputId:'plan-snapshot'})`);const afterPush=await evaluate('history.length');await evaluate('history.back()');await waitForMode('conversation');
      assertExpected(await evaluate(`(()=>({length:history.length,runState:document.documentElement.dataset.runState,state:new URLSearchParams(location.search).get('state')}))()`),{length:afterPush,runState:'running',state:'normal'});break;
    }
    case 'forward-reopens-output':{
      await navigate('?theme=dark&state=normal');await evaluate(`window.__sampleTest.dispatch({type:'OPEN_OUTPUT',outputId:'plan-snapshot'})`);await evaluate('history.back()');await waitForMode('conversation');await evaluate('history.forward()');await waitForMode('outputViewer');
      assertExpected(await evaluate(`(()=>({runState:document.documentElement.dataset.runState,output:new URLSearchParams(location.search).get('output')}))()`),{runState:'running',output:'plan-snapshot'});break;
    }
    case 'reload-preserves-output':{
      await navigate('?theme=light&state=normal&mode=output&output=plan-snapshot');await cdp.send('Page.reload',{},sessionId);const deadline=Date.now()+5000;while(Date.now()<deadline&&!await evaluate('document.readyState==="complete"&&Boolean(window.__sampleTest)'))await sleep(25);await waitForMode('outputViewer');
      assertExpected(await evaluate(`(()=>({theme:document.documentElement.dataset.theme,runState:document.documentElement.dataset.runState,viewer:document.querySelector('[data-output-viewer]')?.getAttribute('data-output-viewer')}))()`),{theme:'light',runState:'running',viewer:'plan-snapshot'});break;
    }
    case 'direct-link-output':{
      await navigate('?theme=dark&state=empty&mode=output&output=plan-snapshot');
      assertExpected(await evaluate(`(()=>({sessionPhase:document.documentElement.dataset.sessionPhase,runState:document.documentElement.dataset.runState,mode:document.documentElement.dataset.workspaceMode,title:document.querySelector('#output-title')?.textContent}))()`),{sessionPhase:'new',runState:'idle',mode:'outputViewer',title:'验证方案.md'});break;
    }
    case 'invalid-query-normalizes':{
      await navigate('?theme=unknown&state=unknown&mode=output');
      assertExpected(await evaluate(`(()=>({theme:document.documentElement.dataset.theme,runState:document.documentElement.dataset.runState,mode:document.documentElement.dataset.workspaceMode,state:new URLSearchParams(location.search).get('state')}))()`),{theme:'dark',runState:'running',mode:'conversation',state:'normal'});break;
    }
    default:throw new Error(`unknown history operation: ${item.operation}`);
  }
};

const runners={transition:runTransition,url:runUrl,'input-focus':runInputFocus,indicator:runIndicator,rail:runRail,history:runHistory};
const failures=[];
let pass=0;
try{
  for(const item of manifest.cases){
    try{await runners[item.category](item);pass+=1;}
    catch(error){
      let snapshot={url:'unavailable'};try{snapshot=await stateSnapshot();}catch{}
      failures.push({id:item.id,url:snapshot.url,state:snapshot.state||snapshot,assertion:error.message});
    }
  }
}finally{
  cdp.close();browser.kill('SIGTERM');
}

for(const failure of failures)console.error(`P0_FAIL id=${failure.id} url=${failure.url} state=${JSON.stringify(failure.state)} assertion=${JSON.stringify(failure.assertion)}`);
for(const error of consoleErrors)console.error(`P0_CONSOLE_ERROR ${JSON.stringify(error)}`);
for(const url of externalRequests)console.error(`P0_EXTERNAL_REQUEST ${url}`);
for(const error of failedRequests)console.error(`P0_FAILED_REQUEST ${error}`);
console.log(`P0_GATE total=${manifest.cases.length} pass=${pass} fail=${failures.length} consoleErrors=${consoleErrors.length} externalRequests=${externalRequests.length} failedRequests=${failedRequests.length}`);
if(failures.length||consoleErrors.length||externalRequests.length||failedRequests.length)process.exitCode=1;
