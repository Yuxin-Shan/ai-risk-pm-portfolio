      const listFixture=window.RISK_FIXTURES.objects.listEntries['LIST-1001'];
      const listAllowedStates=window.RISK_FIXTURES.enums.enabledStates;
      const listCopy=value=>structuredClone(value);
      const listInitialState=()=>{
        const query=new URLSearchParams(location.search);const requested=query.get('state');
        return {theme:query.get('theme')==='light'?'light':'dark',objectState:listAllowedStates.includes(requested)?requested:listFixture.enabledState,fixtureIds:[listFixture.id],addedEntries:[],disabledIds:requested==='disabled'?[listFixture.id]:[],filter:'',selectedId:listFixture.id,notice:'',ui:{leftDrawerOpen:false,rightDrawerOpen:false}};
      };
      const listsReducer=(state,event)=>{
        const next=listCopy(state);
        switch(event.type){
          case 'ADD_ENTRY':if(!next.addedEntries.some(item=>item.id==='LIST-1002')){next.addedEntries.push({id:'LIST-1002',listType:'whitelist',effectScope:'merchant',enabledState:'enabled'});next.selectedId='LIST-1002';next.notice='已新增名单条目';}break;
          case 'DISABLE_ENTRY':if(event.id&&(event.id===listFixture.id||next.addedEntries.some(item=>item.id===event.id))&&!next.disabledIds.includes(event.id)){next.disabledIds.push(event.id);next.selectedId=event.id;next.objectState='disabled';next.notice='名单条目已停用';}break;
          case 'SET_FILTER':next.filter=String(event.value||'');break;
          case 'SELECT_ENTRY':next.selectedId=event.id;break;
          case 'TOGGLE_DRAWER':if(event.drawer==='left')next.ui.leftDrawerOpen=!next.ui.leftDrawerOpen;if(event.drawer==='right')next.ui.rightDrawerOpen=!next.ui.rightDrawerOpen;break;
          case 'SET_THEME':if(['dark','light'].includes(event.theme))next.theme=event.theme;break;
        }
        if(!listAllowedStates.includes(next.objectState))throw new Error(`invalid list state: ${next.objectState}`);
        return next;
      };
      let listsPageState=listInitialState();
      const listEntriesFor=state=>[...state.fixtureIds.map(id=>window.RISK_FIXTURES.objects.listEntries[id]),...state.addedEntries].filter(item=>item&&(!state.filter||item.id.toLowerCase().includes(state.filter.toLowerCase())));
      const listStateLabel=value=>value==='enabled'?'启用':'停用';
      const listTone=value=>value==='enabled'?'success':'neutral';
      const renderLists=state=>{
        document.documentElement.dataset.theme=state.theme;document.documentElement.dataset.pageState='ready';document.documentElement.dataset.objectState=state.objectState;
        const rows=listEntriesFor(state).map(item=>{const actual=state.disabledIds.includes(item.id)?'disabled':item.enabledState;return `<tr data-entry-id="${escapeHtml(item.id)}" data-entry-state="${actual}"><td class="mono">${escapeHtml(item.id)}</td><td>${item.listType==='blacklist'?'黑名单':'白名单'}</td><td>${({account:'账户',merchant:'商户',transaction:'交易'})[item.effectScope]}</td><td><span class="badge ${listTone(actual)}">${listStateLabel(actual)}</span></td><td><button class="btn" type="button" data-disable-entry="${escapeHtml(item.id)}" ${actual==='disabled'?'disabled':''}>停用</button></td></tr>`;}).join('');
        content.innerHTML=`<div class="page-intro"><div><h2>名单条目</h2><p>按类型和生效范围维护单条名单；不包含多步导入流程。</p></div><button class="btn primary" id="add-entry" type="button">新增白名单条目</button></div><div class="toolbar"><input class="search" id="list-filter" aria-label="查询名单 ID" placeholder="查询名单 ID" value="${escapeHtml(state.filter)}"><span class="rail-meta">${rows?`${listEntriesFor(state).length} 条记录`:'0 条记录'}</span></div><div class="table-card"><table><thead><tr><th>ID</th><th>类型</th><th>生效范围</th><th>状态</th><th>动作</th></tr></thead><tbody>${rows||'<tr><td colspan="5">没有匹配记录</td></tr>'}</tbody></table></div>`;
        const all=[...state.fixtureIds.map(id=>window.RISK_FIXTURES.objects.listEntries[id]),...state.addedEntries];const selected=all.find(item=>item?.id===state.selectedId)||listFixture;const selectedState=state.disabledIds.includes(selected.id)?'disabled':selected.enabledState;
        document.querySelector('#right-rail-content').innerHTML=`<div class="rail"><div class="rail-head"><span class="rail-kicker">LIST OBJECT</span><h2>名单对象</h2></div><section class="rail-card"><div class="rail-row"><strong>ID</strong><span class="mono">${escapeHtml(selected.id)}</span></div><div class="rail-row"><strong>类型</strong><span>${selected.listType==='blacklist'?'黑名单':'白名单'}</span></div><div class="rail-row"><strong>范围</strong><span>${({account:'账户',merchant:'商户',transaction:'交易'})[selected.effectScope]}</span></div><div class="rail-row"><strong>当前状态</strong><span>${listStateLabel(selectedState)}</span></div><div class="rail-row"><strong>更新时间</strong><span>${FIXED_TIME}</span></div></section><p class="rail-note">单条新增与停用动作由本页 reducer 记录。</p></div>`;
        const indicator=document.querySelector('#page-indicator');indicator.className=`run-indicator ${listTone(state.objectState)}`;document.querySelector('#page-indicator-text').textContent=listStateLabel(state.objectState);
        const toast=document.querySelector('#toast');toast.textContent=state.notice;toast.classList.toggle('show',Boolean(state.notice));
        const leftNarrow=matchMedia('(max-width:759px)').matches,rightNarrow=matchMedia('(max-width:979px)').matches;const sidebar=document.querySelector('#sidebar'),objects=document.querySelector('#objects');sidebar.classList.toggle('open',leftNarrow&&state.ui.leftDrawerOpen);objects.classList.toggle('open',rightNarrow&&state.ui.rightDrawerOpen);document.querySelector('.sidebar-toggle').setAttribute('aria-expanded',String(leftNarrow&&state.ui.leftDrawerOpen));document.querySelector('.objects-toggle').setAttribute('aria-expanded',String(rightNarrow&&state.ui.rightDrawerOpen));sidebar.toggleAttribute('inert',leftNarrow&&!state.ui.leftDrawerOpen);objects.toggleAttribute('inert',rightNarrow&&!state.ui.rightDrawerOpen);
      };
      const listsDispatch=event=>{listsPageState=listsReducer(listsPageState,event);renderLists(listsPageState);const query=new URLSearchParams(location.search);query.set('theme',listsPageState.theme);query.set('state',listsPageState.objectState);history.replaceState({page:'lists'},'',`?${query}`);return listCopy(listsPageState);};
      document.addEventListener('click',event=>{const add=event.target.closest('#add-entry');if(add){listsDispatch({type:'ADD_ENTRY'});return;}const disable=event.target.closest('[data-disable-entry]');if(disable){listsDispatch({type:'DISABLE_ENTRY',id:disable.dataset.disableEntry});return;}const drawer=event.target.closest('.sidebar-toggle,.objects-toggle');if(drawer)listsDispatch({type:'TOGGLE_DRAWER',drawer:drawer.matches('.sidebar-toggle')?'left':'right'});});
      document.addEventListener('input',event=>{if(event.target.matches('#list-filter'))listsDispatch({type:'SET_FILTER',value:event.target.value});});
      addEventListener('popstate',()=>{listsPageState=listInitialState();renderLists(listsPageState);});
      Object.defineProperty(window,'__pageTest',{value:Object.freeze({page:'lists',events:Object.freeze(['ADD_ENTRY','DISABLE_ENTRY','SET_FILTER','SELECT_ENTRY','TOGGLE_DRAWER','SET_THEME']),getState:()=>listCopy(listsPageState),dispatch:event=>listsDispatch(listCopy(event)),reduce:(state,event)=>listsReducer(listCopy(state),listCopy(event))}),writable:false,configurable:false});
      renderLists(listsPageState);
