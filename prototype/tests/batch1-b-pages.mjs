#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';

const parseArgs=argv=>{const result={};for(let index=0;index<argv.length;index+=2){const key=argv[index];if(!key?.startsWith('--')||argv[index+1]===undefined)throw new Error(`invalid argument near ${key||'<end>'}`);result[key.slice(2)]=argv[index+1];}return result;};
const args=parseArgs(process.argv.slice(2));
for(const key of ['browser','manifest','root'])if(!args[key])throw new Error(`missing --${key}`);
if(!fs.existsSync(args.browser))throw new Error(`browser not found: ${args.browser}`);
const manifest=JSON.parse(fs.readFileSync(args.manifest,'utf8'));
if(!Array.isArray(manifest.cases))throw new Error('manifest.cases must be an array');
const ids=new Set();for(const item of manifest.cases){if(!item.id||!item.page||!item.operation)throw new Error('case requires id, page and operation');if(ids.has(item.id))throw new Error(`duplicate case id: ${item.id}`);ids.add(item.id);}

const userDataDir=fs.mkdtempSync(path.join(os.tmpdir(),'batch1-b-pages-'));
const browser=spawn(args.browser,['--headless','--no-sandbox','--disable-gpu','--hide-scrollbars','--force-device-scale-factor=1','--window-size=1200,960','--remote-debugging-port=0',`--user-data-dir=${userDataDir}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
let stderr='';
const endpoint=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error(`DevTools endpoint timeout\n${stderr}`)),10000);browser.stderr.setEncoding('utf8');browser.stderr.on('data',chunk=>{stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match){clearTimeout(timer);resolve(match[1]);}});browser.once('exit',code=>{clearTimeout(timer);reject(new Error(`browser exited before endpoint: ${code}\n${stderr}`));});});

class CdpClient{
  constructor(url){this.socket=new WebSocket(url);this.nextId=1;this.pending=new Map();this.listeners=new Map();}
  async open(){if(this.socket.readyState===WebSocket.OPEN)return;await new Promise((resolve,reject)=>{this.socket.addEventListener('open',resolve,{once:true});this.socket.addEventListener('error',reject,{once:true});});this.socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id){const waiter=this.pending.get(message.id);if(!waiter)return;this.pending.delete(message.id);if(message.error)waiter.reject(new Error(`${waiter.method}: ${message.error.message}`));else waiter.resolve(message.result);return;}for(const listener of this.listeners.get(message.method)||[])listener(message.params||{},message.sessionId);});}
  send(method,params={},sessionId){const id=this.nextId++;return new Promise((resolve,reject)=>{this.pending.set(id,{resolve,reject,method});this.socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});}
  on(method,listener){const current=this.listeners.get(method)||[];current.push(listener);this.listeners.set(method,current);}
  close(){this.socket.close();}
}

const cdp=new CdpClient(endpoint);await cdp.open();const {targetId}=await cdp.send('Target.createTarget',{url:'about:blank'});const {sessionId}=await cdp.send('Target.attachToTarget',{targetId,flatten:true});for(const method of ['Page.enable','Runtime.enable','Network.enable','Log.enable'])await cdp.send(method,{},sessionId);await cdp.send('Emulation.setDeviceMetricsOverride',{width:1200,height:960,deviceScaleFactor:1,mobile:false},sessionId);
let activePage='';const evidence={};const bucket=()=>evidence[activePage]||(evidence[activePage]={consoleErrors:[],externalRequests:[],failedRequests:[]});
cdp.on('Runtime.exceptionThrown',params=>bucket().consoleErrors.push(params.exceptionDetails?.exception?.description||params.exceptionDetails?.text||'Runtime.exceptionThrown'));
cdp.on('Runtime.consoleAPICalled',params=>{if(['error','assert'].includes(params.type))bucket().consoleErrors.push(params.args?.map(arg=>arg.value||arg.description||'').join(' ')||params.type);});
cdp.on('Log.entryAdded',params=>{if(params.entry?.level==='error')bucket().consoleErrors.push(params.entry.text||'Log.entryAdded');});
cdp.on('Network.requestWillBeSent',params=>{if(/^https?:/i.test(params.request?.url||''))bucket().externalRequests.push(params.request.url);});
cdp.on('Network.loadingFailed',params=>bucket().failedRequests.push(`${params.errorText||'loadingFailed'}:${params.requestId}`));
const evaluate=async expression=>{const result=await cdp.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text||'evaluation failed');return result.result.value;};
const sleep=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
const pageUrl=(filename,query='')=>`${pathToFileURL(path.resolve(args.root,filename)).href}${query}`;
const navigate=async(filename,query='')=>{activePage=filename.replace('.html','');bucket();await cdp.send('Page.navigate',{url:pageUrl(filename,query)},sessionId);const deadline=Date.now()+8000;while(Date.now()<deadline){try{if(await evaluate('document.readyState==="complete" && Boolean(window.__pageTest)'))break;}catch{}await sleep(25);}if(!(await evaluate('document.readyState==="complete" && Boolean(window.__pageTest)')))throw new Error('page/test API did not become ready');await evaluate('document.fonts.ready.then(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))');};
const runOperation=operation=>evaluate(`(async()=>{const raf=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));switch(${JSON.stringify(operation)}){
  case 'add-entry':document.querySelector('#add-entry').click();await raf();return {page:window.__pageTest.page,added:window.__pageTest.getState().addedEntries.length,row:document.querySelectorAll('[data-entry-id="LIST-1002"]').length,state:document.querySelector('[data-entry-id="LIST-1002"]')?.dataset.entryState,fixtureState:window.RISK_FIXTURES.objects.listEntries['LIST-1001'].enabledState};
  case 'disable-entry':document.querySelector('[data-disable-entry="LIST-1001"]').click();await raf();return {page:window.__pageTest.page,disabled:window.__pageTest.getState().disabledIds.includes('LIST-1001'),state:document.querySelector('[data-entry-id="LIST-1001"]')?.dataset.entryState,label:document.querySelector('[data-entry-id="LIST-1001"] .badge')?.textContent,fixtureState:window.RISK_FIXTURES.objects.listEntries['LIST-1001'].enabledState};
  case 'switch-version-state':document.querySelector('#switch-version-state').click();await raf();return {page:window.__pageTest.page,state:window.__pageTest.getState().releaseState,domState:document.querySelector('[data-feature-id]')?.dataset.releaseState,rootState:document.documentElement.dataset.objectState,fixtureState:window.RISK_FIXTURES.objects.features['FEATURE-RISK-VELOCITY'].releaseState};
  case 'negative-sample-lookup':document.querySelector('#lookup-negative-sample').click();await raf();return {page:window.__pageTest.page,selected:window.__pageTest.getState().selectedNegativeSampleId,card:document.querySelector('[data-negative-sample]')?.dataset.negativeSample,reference:window.RISK_FIXTURES.objects.datasets['DATASET-RISK-Q3'].negativeSampleRefs[0],caseExists:Boolean(window.RISK_FIXTURES.objects.monitorCases['CASE-4517'])};
  default:throw new Error('unknown operation');
}})()`);
const expectations={
  'add-entry':{page:'lists',added:1,row:1,state:'enabled',fixtureState:'enabled'},
  'disable-entry':{page:'lists',disabled:true,state:'disabled',label:'停用',fixtureState:'enabled'},
  'switch-version-state':{page:'features',state:'retired',domState:'retired',rootState:'retired',fixtureState:'published'},
  'negative-sample-lookup':{page:'datasets',selected:'CASE-4517',card:'CASE-4517',reference:'CASE-4517',caseExists:true}
};
const assertObject=(actual,expected)=>{for(const [key,value] of Object.entries(expected))if(!Object.is(actual[key],value))throw new Error(`${key}: expected ${JSON.stringify(value)}, received ${JSON.stringify(actual[key])}`);};
let passed=0;const failures=[];
for(const item of manifest.cases){try{await navigate(item.page,item.query||'');const actual=await runOperation(item.operation);assertObject(actual,expectations[item.operation]);passed++;console.log(`B_PAGE_CASE id=${item.id} pass=1 result=${JSON.stringify(actual)}`);}catch(error){failures.push({id:item.id,error:error.message});console.log(`B_PAGE_CASE id=${item.id} pass=0 error=${JSON.stringify(error.message)}`);}}
if(args.screenshots){fs.mkdirSync(args.screenshots,{recursive:true});for(const page of ['lists','features','datasets']){await navigate(`${page}.html`,'?theme=light');const metrics=await evaluate('({width:innerWidth,height:innerHeight,scrollHeight:document.documentElement.scrollHeight,scrollWidth:document.documentElement.scrollWidth})');const {data}=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true},sessionId);const output=path.join(args.screenshots,`${page}.png`);fs.writeFileSync(output,Buffer.from(data,'base64'));console.log(`B_PAGE_SCREENSHOT page=${page} path=${output} bytes=${fs.statSync(output).size} viewport=${metrics.width}x${metrics.height} scroll=${metrics.scrollWidth}x${metrics.scrollHeight}`);}}
for(const page of ['lists','features','datasets']){const result=evidence[page]||{consoleErrors:[],externalRequests:[],failedRequests:[]};console.log(`B_PAGE_OFFLINE page=${page} consoleErrors=${result.consoleErrors.length} externalRequests=${result.externalRequests.length} failedRequests=${result.failedRequests.length}`);for(const error of result.consoleErrors)console.log(`B_PAGE_CONSOLE page=${page} ${JSON.stringify(error)}`);}
console.log(`B_PAGE_GATE total=${manifest.cases.length} pass=${passed} fail=${failures.length}`);
cdp.close();browser.kill('SIGTERM');
if(failures.length||Object.values(evidence).some(item=>item.consoleErrors.length||item.externalRequests.length||item.failedRequests.length))process.exitCode=1;
