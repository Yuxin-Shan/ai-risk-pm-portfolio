'use strict';
const $ = id => document.getElementById(id);
const labels = { awaiting_approval:'待授权', queued:'排队中', running:'执行中', succeeded:'已完成 · 待人工判断', needs_human:'需人工处理', cancelled:'已取消' };
const eventLabels = {approval_requested:'创建授权包',approved:'人工授权',started:'开始执行',model_request:'请求模型',model_response:'模型响应',tool_result:'工具执行结果',tool_blocked:'阻止越权工具',completed:'完成',failed:'失败并转人工',cancelled:'取消',interrupted:'进程中断',human_resolution:'人工处置'};
let bootstrap, selected, records = [], fetching = false, lastDetail = '', toastTimer;
function error(message) { $('error').textContent = message; $('error').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('error').hidden = true, 6000); }
async function api(path, body) {
  const response = await fetch(path, body === undefined ? {} : {method:'POST',headers:{'Content-Type':'application/json','X-Runtime-Token':bootstrap.token},body:JSON.stringify(body)});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '请求失败');
  return result;
}
function option(value, text) { const node = document.createElement('option'); node.value = value; node.textContent = text; return node; }
function targets() {
  const previous = $('target').value;
  $('target').replaceChildren();
  if ($('agent').value === 'investigator') for (const item of bootstrap.cases) $('target').append(option(item.id,item.id + ' · ' + item.title));
  else for (const run of records.filter(r => ['succeeded','needs_human','cancelled'].includes(r.status))) $('target').append(option(run.id,bootstrap.agents[run.agentId].name + ' · ' + run.id.slice(0,8)));
  if ([...$('target').options].some(o=>o.value===previous)) $('target').value = previous;
}
function renderRuns() {
  $('runs').replaceChildren();
  for (const run of records) {
    const b = document.createElement('button'); b.className = 'run'; b.type='button'; b.setAttribute('aria-current',String(run.id===selected));
    b.append(document.createTextNode(bootstrap.agents[run.agentId].name));
    const small = document.createElement('small'); small.textContent = (run.resolution?'已人工处置':labels[run.status]) + ' · ' + run.id.slice(0,8); b.append(small);
    b.onclick = () => { selected=run.id; lastDetail=''; refresh().catch(e=>error(e.message)); }; $('runs').append(b);
  }
}
function renderDetail(data) {
  const signature = JSON.stringify(data); if (signature === lastDetail) return; lastDetail=signature;
  const {run,events}=data; $('empty').hidden=true; $('detail').hidden=false;
  $('run-title').textContent=bootstrap.agents[run.agentId].name; $('status').textContent=run.resolution?'已人工处置':labels[run.status];
  $('run-id').textContent=run.id+' · '+run.targetId; $('run-prompt').textContent=run.prompt;
  $('approval').hidden=run.status!=='awaiting_approval'; $('package-id').textContent=run.packageId;
  $('scope').textContent='授权工具：'+bootstrap.agents[run.agentId].tools.join('、');
  $('approve').disabled=!bootstrap.configured;
  $('cancel').hidden=!['awaiting_approval','queued','running'].includes(run.status);
  $('failure').textContent=run.error?'执行提示：'+run.error+'。请查看证据，人工判断是否重建任务。':'';
  $('output').textContent=run.output || '尚未生成结果';
  $('resolve').hidden=!['succeeded','needs_human'].includes(run.status)||Boolean(run.resolution);
  $('resolution').textContent=run.resolution?'人工处置（本地模拟）：'+run.resolution.decision+'；'+run.resolution.note:'';
  $('events').replaceChildren();
  for (const event of events) { const d=document.createElement('details'), s=document.createElement('summary'), p=document.createElement('pre'); s.textContent=new Date(event.time).toLocaleTimeString()+' · '+(eventLabels[event.kind]||event.kind); p.textContent=JSON.stringify(event.detail,null,2); d.append(s,p); $('events').append(d); }
}
async function refresh() {
  if(fetching)return; fetching=true;
  try { records=await api('/api/runs'); renderRuns(); targets(); if(selected)renderDetail(await api('/api/runs/'+selected)); }
  finally{fetching=false;}
}
function action(id, handler) { $(id).addEventListener('click',async()=>{ $(id).disabled=true; try{await handler();await refresh();}catch(e){error(e.message);}finally{$(id).disabled=id==='approve'&&!bootstrap.configured;} }); }
$('agent').onchange=()=>{targets();$('description').textContent=bootstrap.agents[$('agent').value].description;$('prompt').value=$('agent').value==='investigator'?'调查该案件，引用工具证据，指出缺失信息并给出人工处置建议。':$('agent').value==='evaluator'?'核查该次执行的证据与工具记录，计算检查结果，说明不能证明的指标。':'依据该任务的实际事件定位问题，区分已证实原因与待核实假设。';};
$('create').onsubmit=async e=>{e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;try{const run=await api('/api/runs',{agentId:$('agent').value,targetId:$('target').value,prompt:$('prompt').value});selected=run.id;lastDetail='';await refresh();}catch(e){error(e.message);}finally{button.disabled=false;}};
action('approve',async()=>{const r=records.find(r=>r.id===selected);await api('/api/runs/'+selected+'/approve',{packageId:r.packageId});});
action('cancel',()=>api('/api/runs/'+selected+'/cancel',{}));
$('resolve').onsubmit=async e=>{e.preventDefault();try{await api('/api/runs/'+selected+'/resolve',{decision:$('decision').value,note:$('note').value});$('note').value='';await refresh();}catch(e){error(e.message);}};
(async()=>{try{bootstrap=await api('/api/bootstrap');for(const [id,a]of Object.entries(bootstrap.agents))$('agent').append(option(id,a.name));$('agent').onchange();$('connection').textContent=bootstrap.configured?'模型已配置：'+bootstrap.model+'（真实连通性以执行结果为准）':'模型尚未配置：请设置服务端 .env 后重启。可先创建任务，不能执行。';await refresh();setInterval(()=>refresh().catch(e=>error(e.message)),1500);}catch(e){error(e.message);$('connection').textContent='本地服务连接失败';}})();
