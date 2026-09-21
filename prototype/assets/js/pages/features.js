      const featureFixture=window.RISK_FIXTURES.objects.features['FEATURE-RISK-VELOCITY'];
      const featureStates=window.RISK_FIXTURES.enums.featureReleaseStates;
      const featureCopy=value=>structuredClone(value);
      const featureInitialState=()=>{const query=new URLSearchParams(location.search);const requested=query.get('state');return {theme:query.get('theme')==='light'?'light':'dark',releaseState:featureStates.includes(requested)?requested:featureFixture.releaseState,selectedId:featureFixture.id,notice:'',ui:{leftDrawerOpen:false,rightDrawerOpen:false}};};
      const featuresReducer=(state,event)=>{
        const next=featureCopy(state);
        switch(event.type){
          case 'SWITCH_VERSION_STATE':{const index=featureStates.indexOf(next.releaseState);next.releaseState=featureStates[(index+1)%featureStates.length];next.notice=`版本状态切换为${next.releaseState}`;break;}
          case 'TOGGLE_DRAWER':if(event.drawer==='left')next.ui.leftDrawerOpen=!next.ui.leftDrawerOpen;if(event.drawer==='right')next.ui.rightDrawerOpen=!next.ui.rightDrawerOpen;break;
          case 'SET_THEME':if(['dark','light'].includes(event.theme))next.theme=event.theme;break;
        }
        if(!featureStates.includes(next.releaseState))throw new Error(`invalid feature state: ${next.releaseState}`);return next;
      };
      let featuresPageState=featureInitialState();
      const featurePresentation=value=>({draft:{label:'草稿',tone:'warning'},published:{label:'已发布',tone:'success'},retired:{label:'已退役',tone:'neutral'}}[value]);
      const renderFeatures=state=>{
        const view=featurePresentation(state.releaseState);document.documentElement.dataset.theme=state.theme;document.documentElement.dataset.pageState='ready';document.documentElement.dataset.objectState=state.releaseState;
        content.innerHTML=`<div class="page-intro"><div><h2>特征版本</h2><p>查看冻结版本并执行一次版本状态切换。</p></div><button class="btn primary" id="switch-version-state" type="button">切换版本状态</button></div><div class="table-card"><table><thead><tr><th>特征 ID</th><th>版本</th><th>上线状态</th><th>更新时间</th></tr></thead><tbody><tr data-feature-id="${escapeHtml(featureFixture.id)}" data-release-state="${state.releaseState}"><td class="mono">${escapeHtml(featureFixture.id)}</td><td>${escapeHtml(featureFixture.version)}</td><td><span class="badge ${view.tone}">${view.label}</span></td><td>${FIXED_TIME}</td></tr></tbody></table></div>`;
        document.querySelector('#right-rail-content').innerHTML=`<div class="rail"><div class="rail-head"><span class="rail-kicker">FEATURE VERSION</span><h2>版本详情</h2></div><section class="rail-card"><div class="rail-row"><strong>特征</strong><span>${escapeHtml(featureFixture.id)}</span></div><div class="rail-row"><strong>版本</strong><span>${escapeHtml(featureFixture.version)}</span></div><div class="rail-row"><strong>当前状态</strong><span>${view.label}</span></div><div class="rail-row"><strong>更新时间</strong><span>${FIXED_TIME}</span></div></section><p class="rail-note">状态变化仅作用于本页确定性演示状态，不改写冻结 fixture。</p></div>`;
        const indicator=document.querySelector('#page-indicator');indicator.className=`run-indicator ${view.tone}`;document.querySelector('#page-indicator-text').textContent=view.label;const toast=document.querySelector('#toast');toast.textContent=state.notice;toast.classList.toggle('show',Boolean(state.notice));
        const leftNarrow=matchMedia('(max-width:759px)').matches,rightNarrow=matchMedia('(max-width:979px)').matches;const sidebar=document.querySelector('#sidebar'),objects=document.querySelector('#objects');sidebar.classList.toggle('open',leftNarrow&&state.ui.leftDrawerOpen);objects.classList.toggle('open',rightNarrow&&state.ui.rightDrawerOpen);document.querySelector('.sidebar-toggle').setAttribute('aria-expanded',String(leftNarrow&&state.ui.leftDrawerOpen));document.querySelector('.objects-toggle').setAttribute('aria-expanded',String(rightNarrow&&state.ui.rightDrawerOpen));sidebar.toggleAttribute('inert',leftNarrow&&!state.ui.leftDrawerOpen);objects.toggleAttribute('inert',rightNarrow&&!state.ui.rightDrawerOpen);
      };
      const featuresDispatch=event=>{featuresPageState=featuresReducer(featuresPageState,event);renderFeatures(featuresPageState);const query=new URLSearchParams(location.search);query.set('theme',featuresPageState.theme);query.set('state',featuresPageState.releaseState);history.replaceState({page:'features'},'',`?${query}`);return featureCopy(featuresPageState);};
      document.addEventListener('click',event=>{if(event.target.closest('#switch-version-state')){featuresDispatch({type:'SWITCH_VERSION_STATE'});return;}const drawer=event.target.closest('.sidebar-toggle,.objects-toggle');if(drawer)featuresDispatch({type:'TOGGLE_DRAWER',drawer:drawer.matches('.sidebar-toggle')?'left':'right'});});
      addEventListener('popstate',()=>{featuresPageState=featureInitialState();renderFeatures(featuresPageState);});
      Object.defineProperty(window,'__pageTest',{value:Object.freeze({page:'features',events:Object.freeze(['SWITCH_VERSION_STATE','TOGGLE_DRAWER','SET_THEME']),getState:()=>featureCopy(featuresPageState),dispatch:event=>featuresDispatch(featureCopy(event)),reduce:(state,event)=>featuresReducer(featureCopy(state),featureCopy(event))}),writable:false,configurable:false});
      renderFeatures(featuresPageState);
