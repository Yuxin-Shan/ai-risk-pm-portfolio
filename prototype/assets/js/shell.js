      const renderDemoControls = () => {
        let panel=document.querySelector('#demo-controls');
        if(!appState.demoControls){panel?.remove();return;}
        if(!panel){
          panel=document.createElement('aside');panel.id='demo-controls';panel.setAttribute('aria-label','演示状态控制');
          panel.style.cssText='position:fixed;z-index:99;right:12px;top:54px;display:flex;gap:6px;align-items:center;padding:8px;border:1px solid var(--border);border-radius:8px;background:var(--surface-1);box-shadow:var(--shadow);font-size:12px';
          panel.innerHTML=`<label for="demo-state">演示</label><select id="demo-state" style="height:32px;border:1px solid var(--border);border-radius:6px;background:var(--surface-2);color:var(--text-1)">${[...URL_STATES].map(value=>`<option value="${value}">${value}</option>`).join('')}</select><button type="button" data-core-event="next" class="btn">下一步</button>`;
          document.body.append(panel);
        }
        panel.querySelector('#demo-state').value=urlStateFrom(appState);
        panel.querySelector('[data-core-event="next"]').disabled=!['accepting','awaitingConfirm','running'].includes(appState.runState);
      };
      const leftMedia=matchMedia('(max-width: 759px)');const rightMedia=matchMedia('(max-width: 979px)');
      const focusable='button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
      const renderDrawers = () => {
        const pairs=[{button:document.querySelector('.sidebar-toggle'),panel:document.querySelector('#sidebar'),media:leftMedia,open:appState.ui.leftDrawerOpen},{button:document.querySelector('.objects-toggle'),panel:document.querySelector('#objects'),media:rightMedia,open:appState.ui.rightDrawerOpen}];
        pairs.forEach(({button,panel,media,open})=>{const shown=Boolean(media.matches&&open);panel.classList.toggle('open',shown);button.setAttribute('aria-expanded',String(shown));panel.toggleAttribute('inert',media.matches&&!shown);});
      };
      const render = state => {
        const root=document.documentElement;
        root.dataset.theme=state.theme;root.dataset.sessionPhase=state.sessionPhase;root.dataset.runState=state.runState;root.dataset.workspaceMode=state.workspaceMode;root.dataset.degraded=String(state.runFlags.degraded);
        const main=document.querySelector('.main');const outputMode=state.workspaceMode==='outputViewer';
        main.classList.toggle('session-new',state.sessionPhase==='new'&&!outputMode);main.classList.toggle('output-mode',outputMode);
        document.querySelector('#task-title').textContent=outputMode?outputViewerTitle(state):taskTitle(state);
        const key=viewKey(state);content.innerHTML=outputMode?renderOutputViewer(state):state.runState==='accepting'?acceptingView(state):state.runState==='awaitingConfirm'?confirmView(state):key==='normal'?normalView(state):stateViews[key](state);
        const prompt=document.querySelector('#prompt');if(prompt&&prompt.value!==state.draftText)prompt.value=state.draftText;
        prompt.placeholder=state.sessionPhase==='new'?'描述要验证的风险运营任务…':'追加参数、暂停，或追问证据链…';
        prompt.style.height='auto';prompt.style.height=`${Math.min(122,Math.max(48,prompt.scrollHeight))}px`;
        renderRightRail(state);renderPauseControl(state);renderRunIndicator(state);renderDrawers();renderDemoControls();
        const toast=document.querySelector('#toast');toast.textContent=state.ui.notice;toast.classList.toggle('show',Boolean(state.ui.notice));
        if(state.sessionPhase==='new'&&document.activeElement===document.body)requestAnimationFrame(()=>prompt.focus());
      };
      const historyFreeEvents=new Set(['SET_DRAFT','SET_COMPOSING','SHOW_NOTICE','CLEAR_NOTICE','TOGGLE_DRAWER','CLOSE_DRAWERS']);
      const applyHistoryEffect = (event,previous,next) => {
        if(historyFreeEvents.has(event.type))return;
        if(event.type==='OPEN_OUTPUT'){history.pushState({sample:true,openedOutputInSession:true},'',serializeQuery(next));return;}
        if((event.type==='CLOSE_OUTPUT'||event.type==='CLOSE_ACTIVE_LAYER')&&previous.workspaceMode==='outputViewer'&&previous.ui.openedOutputInSession&&history.length>1){history.back();return;}
        history.replaceState({sample:true,openedOutputInSession:next.ui.openedOutputInSession},'',serializeQuery(next));
      };
      const syncAcceptingTimer = () => {
        if(appState.runState==='accepting'&&!appState.demoControls&&!acceptingTimer){acceptingTimer=setTimeout(()=>{acceptingTimer=null;dispatch({type:'ACCEPTING_COMPLETE',source:'timer'});},1200);}
        if((appState.runState!=='accepting'||appState.demoControls)&&acceptingTimer){clearTimeout(acceptingTimer);acceptingTimer=null;}
      };
      const applyEventFocus = (event,previous,next) => {
        if(event.focusSelector)requestAnimationFrame(()=>document.querySelector(event.focusSelector)?.focus());
        if(event.type==='ACCEPTING_COMPLETE')requestAnimationFrame(()=>{const prompt=document.querySelector('#prompt');if(document.activeElement===prompt&&(next.ui.composing||next.draftText.trim()))return;document.querySelector('#plan-title')?.focus();});
        if(['CONFIRM_PLAN','CONFIRM_RUNNING_CHANGE','CANCEL_RUNNING_CHANGE'].includes(event.type))requestAnimationFrame(()=>document.querySelector('#plan-summary')?.focus());
        if(event.type==='CANCEL_PLAN')requestAnimationFrame(()=>document.querySelector('#prompt')?.focus());
        if(event.type==='EDIT_PLAN')requestAnimationFrame(()=>document.querySelector(event.mode==='save'?'#plan-title':'#plan-scope')?.focus());
        if(event.type==='TOGGLE_DRAWER')requestAnimationFrame(()=>{const panel=document.querySelector(event.drawer==='left'?'#sidebar':'#objects');const open=event.drawer==='left'?appState.ui.leftDrawerOpen:appState.ui.rightDrawerOpen;if(open)(panel.querySelector(focusable)||panel).focus();else document.querySelector(event.drawer==='left'?'.sidebar-toggle':'.objects-toggle')?.focus();});
        if(event.type==='OPEN_OUTPUT')requestAnimationFrame(()=>document.querySelector('#output-title')?.focus());
        if(previous.workspaceMode==='outputViewer'&&next.workspaceMode==='conversation'){const returnId=previous.outputId;outputReturnFocusId=previous.ui.openedOutputInSession?returnId:'';requestAnimationFrame(()=>{const trigger=document.querySelector(`[data-output-open="${CSS.escape(returnId)}"]`)||document.querySelector('.objects-toggle');trigger?.focus();});}
        if(event.type==='CLOSE_ACTIVE_LAYER'&&previous.ui.rightDrawerOpen&&!next.ui.rightDrawerOpen)requestAnimationFrame(()=>document.querySelector('.objects-toggle')?.focus());
        if(event.type==='CLOSE_ACTIVE_LAYER'&&previous.ui.leftDrawerOpen&&!next.ui.leftDrawerOpen)requestAnimationFrame(()=>document.querySelector('.sidebar-toggle')?.focus());
      };
      const dispatch = event => {
        const previous=appState;const next=assertState(reducer(previous,event));appState=next;render(next);applyHistoryEffect(event,previous,next);syncAcceptingTimer();applyEventFocus(event,previous,next);
        if(next.ui.notice){clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>dispatch({type:'CLEAR_NOTICE'}),1400);}
        return copyState(next);
      };
      const noticeFor = action => ({tool:'已显示可用工具（样张反馈）',queue:'已定位待人工队列（样张反馈）',experiment:'已定位实验详情（样张反馈）',report:'报告须门禁完成后生成（样张反馈）'}[action]||'操作已反馈');
