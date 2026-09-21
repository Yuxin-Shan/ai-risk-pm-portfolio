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

const userDataDir=fs.mkdtempSync(path.join(os.tmpdir(),'batch1-a-pages-'));
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
const assertObject=(actual,expected)=>{for(const [key,value] of Object.entries(expected))if(!Object.is(actual[key],value))throw new Error(`${key}: expected ${JSON.stringify(value)}, received ${JSON.stringify(actual[key])}`);};
const keyboardPath=async()=>{await evaluate('document.querySelector("#prompt-template").focus()');const sequence=[await evaluate('document.activeElement.id')];for(let index=0;index<2;index++){await cdp.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,nativeVirtualKeyCode:9},sessionId);await cdp.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,nativeVirtualKeyCode:9},sessionId);sequence.push(await evaluate('document.activeElement.id'));}return sequence;};
const runOperation=async operation=>{
  if(operation==='keyboard-path')return {page:await evaluate('window.__pageTest.page'),sequence:(await keyboardPath()).join('>')};
  return evaluate(`(async()=>{const raf=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));const save=async()=>{const form=document.querySelector('#agent-config-form');form.querySelector('#prompt-template').value='汇总高风险案件证据，标明缺失项、授权状态与处置建议。';form.requestSubmit();await raf();};switch(${JSON.stringify(operation)}){
    case 'save-new-version':await save();return {page:window.__pageTest.page,created:window.__pageTest.getState().createdVersions.length,newId:window.__pageTest.getState().createdVersions[0]?.id,row:document.querySelectorAll('[data-agent-version="AGENT-OPS-V3.3"]').length,selected:document.querySelector('[data-version-detail]')?.dataset.versionDetail,fixtureId:window.RISK_FIXTURES.objects.agentVersions['AGENT-OPS-V3.2'].id};
    case 'old-version-readable':await save();document.querySelector('[data-select-version="AGENT-OPS-V3.2"]').click();await raf();return {page:window.__pageTest.page,versionCount:window.__pageTest.getState().versionIds.length,selected:document.querySelector('[data-version-detail]')?.dataset.versionDetail,prompt:document.querySelector('[data-version-detail] p')?.textContent,oldRow:document.querySelectorAll('[data-agent-version="AGENT-OPS-V3.2"]').length};
    case 'change-record':await save();return {page:window.__pageTest.page,logCount:window.__pageTest.getState().changeLog.length,logId:document.querySelector('[data-change-version]')?.dataset.changeVersion,logText:document.querySelector('[data-change-version]')?.textContent,time:window.RISK_FIXTURES.fixedTime};
    case 'permission-boundary':return {page:window.__pageTest.page,present:document.querySelectorAll('[data-permission-boundary]').length,text:document.querySelector('[data-permission-boundary]')?.textContent,authId:window.RISK_FIXTURES.objects.authPackages['AUTH-204'].id,status:window.RISK_FIXTURES.objects.authPackages['AUTH-204'].approvalStatus};
    case 'register-pending-approval':document.querySelector('#register-tool').click();await raf();return {page:window.__pageTest.page,registration:window.__pageTest.getState().registrationState,approval:window.__pageTest.getState().approvalStatus,packageGenerated:window.__pageTest.getState().packageGenerated,rowRegistration:document.querySelector('[data-tool-id]')?.dataset.registrationState,rowApproval:document.querySelector('[data-tool-id]')?.dataset.approvalState,packageText:document.querySelector('#right-rail-content')?.textContent.includes('AUTH-204'),fixtureApproval:window.RISK_FIXTURES.objects.authPackages['AUTH-204'].approvalStatus};
    case 'case-call-record':{const form=document.querySelector('#case-search-form');form.querySelector('#case-query').value='CASE-4517';form.requestSubmit();await raf();const record=document.querySelector('[data-call-record]');return {page:window.__pageTest.page,found:window.__pageTest.getState().foundEvidenceId,recordId:record?.dataset.callRecord,time:record?.textContent.includes('23:08'),inputSummary:record?.textContent.includes('案件 CASE-4517 · SCHEMA-EVIDENCE-V2'),result:record?.textContent.includes('success'),caseId:window.RISK_FIXTURES.objects.evidence['EVIDENCE-88209'].caseId};}
    case 'unauthorized-disabled':{const pending={designated:document.querySelector('#call-designated-agent').disabled,unauthorized:document.querySelector('#call-unauthorized-agent').disabled,approval:window.__pageTest.getState().approvalStatus};history.replaceState({},'',location.pathname+'?theme=light&state=approved&scenario=tool-authorization&stage=approved&object=AUTH-204');dispatchEvent(new PopStateEvent('popstate'));await raf();return {page:window.__pageTest.page,pendingDesignated:pending.designated,pendingUnauthorized:pending.unauthorized,pendingApproval:pending.approval,approvedDesignated:document.querySelector('#call-designated-agent').disabled,approvedUnauthorized:document.querySelector('#call-unauthorized-agent').disabled};}
    default:throw new Error('unknown operation');
  }})()`);
};
const expectations={
  'save-new-version':{page:'agent-config',created:1,newId:'AGENT-OPS-V3.3',row:1,selected:'AGENT-OPS-V3.3',fixtureId:'AGENT-OPS-V3.2'},
  'old-version-readable':{page:'agent-config',versionCount:2,selected:'AGENT-OPS-V3.2',prompt:'汇总高风险案件证据，标明缺失项并给出处置建议。',oldRow:1},
  'change-record':{page:'agent-config',logCount:1,logId:'AGENT-OPS-V3.3',logText:'AGENT-OPS-V3.3 · 23:08 · prompt、toolPermissionRefs',time:'23:08'},
  'permission-boundary':{page:'agent-config',present:1,text:'权限边界：授权包 AUTH-204 状态为 pendingApproval；审批前不可调用。',authId:'AUTH-204',status:'pendingApproval'},
  'keyboard-path':{page:'agent-config',sequence:'prompt-template>tool-permission>save-agent-version'},
  'register-pending-approval':{page:'toolbench',registration:'registered',approval:'pendingApproval',packageGenerated:true,rowRegistration:'registered',rowApproval:'pendingApproval',packageText:true,fixtureApproval:'pendingApproval'},
  'case-call-record':{page:'toolbench',found:'EVIDENCE-88209',recordId:'EVIDENCE-88209',time:true,inputSummary:true,result:true,caseId:'CASE-4517'},
  'unauthorized-disabled':{page:'toolbench',pendingDesignated:true,pendingUnauthorized:true,pendingApproval:'pendingApproval',approvedDesignated:false,approvedUnauthorized:true}
};
let passed=0;const failures=[];
for(const item of manifest.cases){try{await navigate(item.page,item.query||'');const actual=await runOperation(item.operation);assertObject(actual,expectations[item.operation]);passed++;console.log(`A_PAGE_CASE id=${item.id} pass=1 result=${JSON.stringify(actual)}`);}catch(error){failures.push({id:item.id,error:error.message});console.log(`A_PAGE_CASE id=${item.id} pass=0 error=${JSON.stringify(error.message)}`);}}

const navExpected={lists:'名单管理',features:'特征发布',datasets:'数据集管理','agent-config':'Agent 配置',toolbench:'工具台'};
for(const [page,active] of Object.entries(navExpected)){try{await navigate(`${page}.html`,'?theme=light');const actual=await evaluate(`(()=>({links:[...document.querySelectorAll('nav a')].map(item=>item.textContent.trim()),hrefs:[...document.querySelectorAll('nav a[href]')].filter(item=>item.getAttribute('href').trim()&&!item.getAttribute('href').startsWith('#')&&new URL(item.href).protocol==='file:').map(item=>item.href),active:[...document.querySelectorAll('nav [aria-current="page"]')].map(item=>item.textContent.trim())}))()`);const required=['策略引擎配置','模型服务','实时监控','对话操作台','实验管理','Agent 配置','工具台','任务队列','证据链视图','验证报告','名单管理','特征发布','数据集管理','日志回放'];if(actual.hrefs.length!==14||actual.hrefs.some(href=>!fs.existsSync(new URL(href)))||required.some(label=>!actual.links.includes(label))||actual.active.length!==1||actual.active[0]!==active)throw new Error(JSON.stringify(actual));console.log(`BATCH1_NAV page=${page} pass=1 linkCount=${actual.hrefs.length} links=${actual.links.join('|')} active=${actual.active[0]}`);}catch(error){failures.push({id:`nav-${page}`,error:error.message});console.log(`BATCH1_NAV page=${page} pass=0 error=${JSON.stringify(error.message)}`);}}

if(args.screenshots){fs.mkdirSync(args.screenshots,{recursive:true});for(const page of ['agent-config','toolbench']){await navigate(`${page}.html`,'?theme=light');const metrics=await evaluate('({width:innerWidth,height:innerHeight,scrollHeight:document.documentElement.scrollHeight,scrollWidth:document.documentElement.scrollWidth})');const {data}=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true},sessionId);const output=path.join(args.screenshots,`${page}.png`);fs.writeFileSync(output,Buffer.from(data,'base64'));console.log(`A_PAGE_SCREENSHOT page=${page} path=${output} bytes=${fs.statSync(output).size} viewport=${metrics.width}x${metrics.height} scroll=${metrics.scrollWidth}x${metrics.scrollHeight}`);}}
for(const page of ['agent-config','toolbench']){const result=evidence[page]||{consoleErrors:[],externalRequests:[],failedRequests:[]};console.log(`A_PAGE_OFFLINE page=${page} consoleErrors=${result.consoleErrors.length} externalRequests=${result.externalRequests.length} failedRequests=${result.failedRequests.length}`);for(const error of result.consoleErrors)console.log(`A_PAGE_CONSOLE page=${page} ${JSON.stringify(error)}`);}
console.log(`A_PAGE_GATE total=${manifest.cases.length} pass=${passed} fail=${failures.length}`);
cdp.close();browser.kill('SIGTERM');
if(failures.length||Object.values(evidence).some(item=>item.consoleErrors.length||item.externalRequests.length||item.failedRequests.length))process.exitCode=1;
