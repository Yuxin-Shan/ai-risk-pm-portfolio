      const escapeHtml = value => String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
      const fixtureRequest='把上周转账案件重跑一遍，对比新版提示词；把可疑样本的手法特征也带上。';
      const taskTitle = state => {
        if(!state.plan)return '对话操作台';
        const source=state.messages.find(message=>message.role==='user')?.text||fixtureRequest;
        const firstClause=source.split(/[；。！？!?]/)[0].trim();
        return firstClause.length>24?`${firstClause.slice(0,24)}…`:firstClause;
      };
      const userMessages = state => (state.messages.length?state.messages:[{role:'user',text:fixtureRequest}]).filter(message=>message.role==='user').map((message,index)=>`<div class="message-user" data-user-message><span class="meta">你 · ${index?FIXED_TIME:'23:04'}</span>${escapeHtml(message.text)}</div>`).join('');
      const STEP_NAMES=['建立实验','读取数据集','两组任务入队','输出对比'];
      const OUTPUT_FIXTURES={
        'plan-snapshot':{kind:'任务附件',title:'验证方案.md',summary:['对比新版提示词与当前版本','范围为上周转账案件','保留可疑样本手法特征','输出门禁四项对比']},
        'R-4517':{kind:'验证报告',title:'效果对比报告',summary:['四个执行步骤已结束','报告汇总准确率与误报率','证据缺失单独标识','结论等待人工复核']}
      };
      const objectStateLabel = state => state.runState==='succeeded'?'已完成':state.runState==='failed'?'失败':state.runState==='timedOut'?'超时':state.runState==='paused'?'已暂停':state.runState==='cancelled'?'已取消':state.runState==='blocked'?'已阻止':state.runFlags.degraded?'降级':state.runState==='running'?'执行中':'已创建';
      const executionStepRows = state => {
        if(['idle','accepting','awaitingConfirm','blocked'].includes(state.runState)||(state.runState==='cancelled'&&state.currentStep===0))return [];
        return STEP_NAMES.map((name,index)=>{
          const step=index+1;
          if(state.runState==='succeeded')return {step,name,status:'已完成',tone:'done'};
          if(state.runFlags.degraded&&step===3)return {step,name,status:'证据缺失',tone:'missing'};
          if(step<state.currentStep)return {step,name,status:'已完成',tone:'done'};
          if(step>state.currentStep)return {step,name,status:'待执行',tone:'pending'};
          if(state.runState==='paused')return {step,name,status:'已暂停',tone:'paused'};
          if(state.runState==='failed')return {step,name,status:'失败',tone:'failed'};
          if(state.runState==='timedOut')return {step,name,status:'超时',tone:'timeout'};
          if(state.runState==='cancelled')return {step,name,status:'已取消',tone:'cancelled'};
          return {step,name,status:'执行中',tone:'current'};
        });
      };
      const rightRailModel = state => {
        const hasTask=state.sessionPhase==='active'&&state.runState!=='idle';
        const stepText=state.currentStep?`第 ${state.currentStep} 步 / 共 4 步`:state.runState==='awaitingConfirm'?'确认后开始':'尚未开始';
        const description={accepting:'正在核对数据集、工具与授权',awaitingConfirm:'计划在主区等待确认',running:state.runFlags.degraded?'可选证据缺失，其余步骤继续':'正在执行已确认计划',paused:'当前步骤已暂停，已有结果保留',cancelled:'执行已取消，在途结果仅作记录',succeeded:'四个步骤均已结束',failed:'当前步骤失败，前序结果保留',timedOut:'必需工具超时，等待人工处理',blocked:'未授权工具不可调用'}[state.runState]||'暂无正在执行的任务';
        const outputId=state.runState==='succeeded'?'R-4517':state.latestOutput?.id||'';
        const output=outputId?OUTPUT_FIXTURES[outputId]||null:null;
        const objects=state.objects.map(id=>({
          '#E-2317':['实验','提示词效果对比'],
          '#T-882':['任务组','批量重跑'],
          '#TR-88209':['证据链','本次执行'],
          '#R-4517':['验证报告','效果对比'],
          '#P-204':['授权申请','工具授权申请']
        }[id]||['相关对象','执行记录'])).map(([type,title],index)=>({type,title,status:objectStateLabel(state),internalId:state.objects[index]}));
        return {hasTask,status:runIndicatorFor(state).label,stepText,description,steps:executionStepRows(state),outputId,output,objects};
      };
      const renderRightRail = state => {
        const model=rightRailModel(state);const rail=document.querySelector('#right-rail-content');
        const steps=model.steps.length?`<section class="rail-section" aria-labelledby="live-steps-title"><h3 class="rail-section-title" id="live-steps-title">实时步骤</h3><div class="live-steps" data-live-steps>${model.steps.map(item=>`<div class="live-step ${item.tone}" data-step="${item.step}" data-step-status="${item.status}"><span class="live-step-index">${String(item.step).padStart(2,'0')}</span><span class="live-step-name">${item.name}</span><span class="live-step-state">${item.status}</span></div>`).join('')}</div></section>`:'';
        const output=model.output?`<section class="rail-section" aria-labelledby="latest-output-title"><h3 class="rail-section-title" id="latest-output-title">最新产出</h3><button class="output-preview" type="button" data-output-open="${escapeHtml(model.outputId)}"><strong>${model.output.title}</strong><span class="output-preview-meta">${model.output.kind} · ${state.updatedAt}</span><ul>${model.output.summary.slice(0,4).map(item=>`<li>${item}</li>`).join('')}</ul><span class="output-preview-action">查看完整内容 →</span></button></section>`:'';
        const objects=model.objects.length?`<section class="rail-section" aria-labelledby="related-objects-title"><h3 class="rail-section-title" id="related-objects-title">对象</h3><div class="object-list">${model.objects.map(item=>`<button class="object-row" type="button" data-demo="${item.internalId==='#TR-88209'?'evidence':item.internalId==='#R-4517'?'report':item.internalId==='#T-882'?'queue':'experiment'}"${item.internalId==='#T-882'?' data-task-id="true"':''}><strong>${item.type} · ${item.title}</strong><span class="object-state">${item.status}</span><small>更新于 ${state.updatedAt}</small></button>`).join('')}</div>${state.objects.includes('#TR-88209')?`<button class="inline-action" type="button" data-output-open="case-detail">查看案件调查轨迹 →</button>`:''}</section>`:'';
        rail.innerHTML=`<div class="rail"><div class="rail-head"><div><span class="rail-kicker">AGENT RUN</span><h2>任务执行</h2></div><span class="rail-time">${state.updatedAt}</span></div>${model.hasTask?`<section class="rail-current" data-rail-current><div class="rail-current-row"><strong>${model.status}</strong><span class="rail-time">${model.stepText}</span></div><span class="rail-kicker">${model.description}</span></section>`:`<p class="rail-empty">暂无正在执行的任务。提交需求后，这里会显示实时步骤与最新产出。</p>`}${steps}${output}${objects}<p class="capability-facts" data-capability-facts>运营助手 Agent · v3.2 · 3 工具可用</p></div>`;
        const toggle=document.querySelector('.objects-toggle');toggle.textContent=model.hasTask?`${model.status}${state.currentStep?` ${state.currentStep}/4`:''}`:'暂无执行';
      };
      const renderPauseControl = state => {
        const button=document.querySelector('#pause');
        const available=['running','paused'].includes(state.runState);
        button.textContent=state.runState==='paused'?'继续任务':'暂停任务';
        button.setAttribute('aria-pressed',String(state.runState==='paused'));
        button.setAttribute('aria-disabled',String(!available));
      };
      const runIndicatorFor = state => {
        if(state.runFlags.degraded)return {tone:'warning',label:'降级运行'};
        return {
          idle:{tone:'neutral',label:'空闲'},accepting:{tone:'info',label:'核对中'},awaitingConfirm:{tone:'warning',label:'等待确认'},
          running:{tone:'success',label:'执行中'},paused:{tone:'warning',label:'已暂停'},cancelled:{tone:'neutral',label:'已取消'},
          succeeded:{tone:'success',label:'已完成'},failed:{tone:'danger',label:'执行失败'},timedOut:{tone:'warning',label:'已超时'},blocked:{tone:'danger',label:'已阻止'}
        }[state.runState];
      };
      const renderRunIndicator = state => {
        const indicator=document.querySelector('#run-indicator');const presentation=runIndicatorFor(state);
        indicator.className=`run-indicator ${presentation.tone}`;
        document.querySelector('#run-indicator-text').textContent=presentation.label;
      };
      const runSummary = state => {
        if(['awaitingConfirm','cancelled','idle'].includes(state.runState))return {badge:''};
        if(state.runState==='succeeded')return {badge:badge('4 / 4 步','success')};
        return {badge:badge('步骤 2 / 4',state.runState==='paused'?'neutral':'running')};
      };
      const assistantText = state => state.runState==='paused'?'执行已暂停；当前结果和证据链已保留。':state.runState==='cancelled'?'执行已取消；在途结果只作为历史证据保留。':state.runState==='succeeded'?'四个步骤均已完成，验证报告已生成。':state.runState==='idle'?'当前没有执行任务，可以继续追问或发起新验证。':'计划已确认，正在执行第 2 步。';
      const normalView = state => { const summary=runSummary(state);const cancelled=state.runState==='cancelled';return `
        ${userMessages(state)}
        <div class="message-assistant" data-assistant-message><strong>运营助手 · ${state.updatedAt}</strong>${assistantText(state)}</div>
        <button class="plan-summary" id="plan-summary" type="button" aria-expanded="false" data-demo="plan-summary"><span>${cancelled?'计划 v2 · 已取消':state.runState==='succeeded'?'计划 v2 · 已完成 · 4 步':'计划 v2 · 已确认 · 4 步'}</span>${summary.badge}</button>
        <div class="mechanisms">
          <article class="card mechanism structured-result" data-structured-result><div class="card-head"><div><h3>工具选择与授权</h3><p>已匹配当前任务所需工具</p></div>${badge('3 可用','neutral')}</div><div class="tool-list"><div class="tool"><span><i class="status-dot" style="color:var(--success)"></i>主体信息查询</span><span>已授权</span></div><div class="tool"><span><i class="status-dot" style="color:var(--success)"></i>历史交易比对</span><span>已授权</span></div><div class="tool off"><span><i class="status-dot"></i>工商股权穿透查询</span><span>未授权 · 禁用</span></div></div></article>
          <article class="card mechanism"><div class="card-head"><div><h3>证据链 · 4 步</h3><p>本次执行留下的关键记录</p></div>${badge('2 / 4','neutral')}</div><div class="evidence-list"><div class="evidence"><span>01 主体信息查询</span><span style="color:var(--success)">完成</span></div><div class="evidence"><span>02 历史交易比对</span><span style="color:var(--info)">${state.runState==='paused'?'已暂停':state.runState==='succeeded'?'完成':'执行中'}</span></div><div class="evidence"><span>03 名单匹配</span><span style="color:var(--text-3)">${state.runState==='succeeded'?'完成':'待执行'}</span></div></div><button class="inline-action" data-demo="evidence">展开输入摘要与耗时 →</button></article>
        </div>
        <div class="old-note" data-interruption-card><strong>中断记录</strong>　23:06 曾暂停并追加“手法特征”；旧参数产出已保留但不并入新结论，从步骤 2 重跑。相关结果已同步到右栏。</div>
        ${['running','paused'].includes(state.runState)?`<div class="actions"><button class="btn" type="button" data-plan-action="running-params">追加参数</button><button class="btn danger" type="button" data-plan-action="cancel-execution">取消执行</button></div>`:''}`; };
      const acceptingView = state => `${userMessages(state)}<div class="message-assistant" data-assistant-message><strong>运营助手 · ${state.updatedAt}</strong>正在核对数据集、工具与授权…</div>`;
      const editPlanForm = state => `<form class="parameter-form" id="parameter-form"><label for="plan-scope">验证范围</label><input id="plan-scope" name="scope" value="上周转账案件 · 新版提示词对比"><div class="plan-actions"><button class="btn primary" type="submit">保存参数</button><button class="btn" type="button" data-plan-action="cancel-edit">取消修改</button></div></form>`;
      const confirmView = state => `${userMessages(state)}<div class="message-assistant" data-assistant-message><strong>运营助手 · ${state.updatedAt}</strong>${state.plan?.previousRun?'已将运行中追加内容整理成变更计划；原在途结果标记为基于旧参数并暂挂。':'已核对数据集、工具与授权。以下计划需你确认后才会执行。'}</div><article class="card plan-confirm"><div class="card-head"><div><div class="title-row" id="plan-title" tabindex="-1">${icon('flask')}${state.plan?.previousRun?'待确认的运行中变更':'待确认计划 · v2'}</div><p class="plan-copy">对比新版提示词与基线，并保留可疑样本的手法特征。</p></div></div><div class="plan-facts"><div class="plan-fact"><span>步骤</span><strong>4 步</strong></div><div class="plan-fact"><span>范围</span><strong>3,812 笔记录</strong></div><div class="plan-fact"><span>预计耗时</span><strong>约 6 分钟</strong></div></div><div class="steps"><div class="step"><span class="step-num">01</span><strong>建立实验</strong><small>新版 vs 基线</small></div><div class="step"><span class="step-num">02</span><strong>读取数据集</strong><small>已选择范围</small></div><div class="step"><span class="step-num">03</span><strong>两组任务入队</strong><small>含手法特征</small></div><div class="step"><span class="step-num">04</span><strong>输出对比</strong><small>门禁四项</small></div></div>${state.ui.editingPlan?editPlanForm(state):`<div class="plan-actions"><button class="btn primary" type="button" data-plan-action="confirm">确认执行</button><button class="btn" type="button" data-plan-action="edit">改参数</button><button class="btn danger" type="button" data-plan-action="cancel">取消</button></div>`}</article>`;
      const stateViews = {
        empty: () => `<div class="state-panel"><article class="state-hero empty"><div class="state-icon" style="margin-left:auto;margin-right:auto">${icon('message')}</div><h2>从一个风险运营任务开始</h2><p>说清要处理的对象、时间范围和希望得到的结果。</p><div class="examples" aria-label="示例指令"><button class="example" type="button" data-example="对比新版提示词与当前版本，列出准确率和误报率差异">对比新版提示词与当前版本，列出准确率和误报率差异</button><button class="example" type="button" data-example="重跑上周的转账案件，按风险手法归类异常样本">重跑上周的转账案件，按风险手法归类异常样本</button><button class="example" type="button" data-example="回放昨天 14:00 后的任务日志，定位失败步骤">回放昨天 14:00 后的任务日志，定位失败步骤</button></div></article></div>`,
        error: state => `<div class="state-panel"><div class="state-context"><span>当前任务 · ${escapeHtml(taskTitle(state))}</span><span>第 3 步 / 共 4 步</span></div><article class="state-hero error"><div class="state-icon">${icon('alert')}</div><div class="card-head"><div><h2>步骤 3 执行失败</h2><p>“历史交易比对”返回的参数格式与当前工具不兼容，未生成强行结论。</p></div></div><div class="detail-grid"><div class="detail"><label>失败步骤</label><strong>03 / 两组任务入队</strong></div><div class="detail"><label>失败原因</label><strong>参数格式不兼容</strong></div><div class="detail"><label>保留结果</label><strong>前 2 步已保留</strong></div></div><div class="result-strip">恢复策略：默认从失败步骤续跑；也可改参数、换已授权工具，或手动选择整组重跑。</div><div class="actions"><button class="btn primary" type="button" data-demo="retry">从步骤 3 重试</button><button class="btn" type="button" data-demo="params">改参数</button><button class="btn" type="button" data-demo="tool">换工具</button></div></article></div>`,
        timeout: () => `<div class="state-panel"><article class="state-hero timeout"><div class="state-icon">${icon('alert')}</div><div class="card-head"><div><h2>必需工具取证超时</h2><p>关联关系查询超过等待时限。系统未输出强行裁决，案件已进入待人工介入队列。</p></div></div><div class="detail-grid"><div class="detail"><label>当前对象</label><strong>转账案件</strong></div><div class="detail"><label>已等待</label><strong>12m 40s</strong></div><div class="detail"><label>承接位置</label><strong>待人工队列</strong></div></div><div class="actions"><button class="btn primary" data-demo="queue">打开待人工队列</button><button class="btn" data-demo="retry">重试必需工具</button></div></article></div>`,
        unauthorized: () => `<div class="state-panel"><article class="state-hero unauthorized"><div class="state-icon">${icon('shield')}</div><div class="card-head"><div><h2>候选工具均未授权</h2><p>已找到“工商股权穿透查询”，但当前不可用。</p></div></div><div class="detail-grid"><div class="detail"><label>匹配候选</label><strong>1 个 · 禁用</strong></div><div class="detail"><label>未授权调用</label><strong>0 次</strong></div><div class="detail"><label>下一步</label><strong>生成授权申请</strong></div></div><div class="result-strip">可前往工具台处理授权申请，或选择已授权的替代工具。</div><div class="actions"><button class="btn primary" data-demo="auth">前往工具台</button><button class="btn">查看替代路径</button></div></article></div>`,
        degraded: () => `<div class="state-panel"><article class="state-hero degraded"><div class="state-icon">${icon('activity')}</div><div class="card-head"><div><h2>可选工具失败，已降级继续</h2><p>名单匹配不可用；该步骤被明确标为证据缺失，其余已授权步骤继续执行。</p></div></div><div class="detail-grid"><div class="detail"><label>失败工具</label><strong>名单匹配 · 可选</strong></div><div class="detail"><label>当前步骤</label><strong>历史交易比对</strong></div><div class="detail"><label>证据链</label><strong>缺失标识已写入</strong></div></div><div class="result-strip">降级不等于成功：验证报告会保留缺失步骤，若证据不足则转人工，不会隐藏或省略。</div><div class="actions"><button class="btn primary" data-demo="evidence">查看证据链</button><button class="btn" data-demo="retry">重试可选工具</button></div></article></div>`
      };
      const viewKey = state => {
        if(state.sessionPhase==='new')return 'empty';
        if(state.runState==='failed')return 'error';
        if(state.runState==='timedOut')return 'timeout';
        if(state.runState==='blocked')return 'unauthorized';
        if(state.runState==='running'&&state.runFlags.degraded)return 'degraded';
        return 'normal';
      };
      const outputViewerTitle = state => state.outputId==='case-detail'?'案件详情 · 调查轨迹':OUTPUT_FIXTURES[state.outputId]?.title||'产出不可用';
      const renderOutputViewer = state => {
        if(state.outputId==='case-detail')return `<article class="output-viewer" data-output-viewer="case-detail"><header class="output-viewer-head"><div><span class="output-viewer-meta">实时监控 · 案件详情</span><h2 id="output-title" tabindex="-1">案件调查轨迹</h2><span class="output-viewer-meta">更新于 ${state.updatedAt}</span></div><button class="viewer-back" type="button" data-output-close>返回对话</button></header><div class="output-viewer-body"><p>案件处于调查中；输入来自规则引擎生成的不可变事件快照。</p><h3>事件快照</h3><ul><li>命中项</li><li>命中特征</li><li>主体信息</li></ul><h3>在线调查轨迹</h3><ol><li>主体信息查询</li><li>历史交易比对</li><li>名单匹配</li><li>关联关系查询</li></ol><p>取证结束后，这里显示证据链、裁决、置信度与临时管控终态；当前不预填尚未产生的裁决。</p></div></article>`;
        const fixture=OUTPUT_FIXTURES[state.outputId];
        if(!fixture)return `<article class="output-viewer" data-output-viewer="missing"><header class="output-viewer-head"><div><span class="output-viewer-meta">只读产出</span><h2 id="output-title" tabindex="-1">产出不可用</h2></div><button class="viewer-back" type="button" data-output-close>返回对话</button></header><div class="output-viewer-body"><p>当前链接未对应到可展示的静态产出。</p></div></article>`;
        const report=state.outputId==='R-4517';
        return `<article class="output-viewer" data-output-viewer="${escapeHtml(state.outputId)}"><header class="output-viewer-head"><div><span class="output-viewer-meta">${fixture.kind} · 更新于 ${state.updatedAt}</span><h2 id="output-title" tabindex="-1">${fixture.title}</h2></div><button class="viewer-back" type="button" data-output-close>返回对话</button></header><div class="output-viewer-body"><p>${report?'本页汇总本次对比任务的静态结果，正式结论仍需人工复核。':'本页是已确认计划的只读快照，用于核对执行范围与预期产出。'}</p><h3>${report?'结果摘要':'执行范围'}</h3><ul>${fixture.summary.map(item=>`<li>${item}</li>`).join('')}</ul><h3>${report?'门禁检查':'执行步骤'}</h3><table><thead><tr><th>项目</th><th>状态</th></tr></thead><tbody>${(report?['准确率','误报率','证据完整性','回滚验证']:STEP_NAMES).map((item,index)=>`<tr><td>${item}</td><td>${report?'待人工复核':`步骤 ${index+1}`}</td></tr>`).join('')}</tbody></table><h3>记录格式</h3><pre><code>source: confirmed-plan\nupdated_at: ${state.updatedAt}\nrender: static-fixture</code></pre></div></article>`;
      };
