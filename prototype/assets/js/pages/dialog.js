      document.addEventListener('click',event=>{
        const coreButton=event.target.closest('[data-core-event="next"]');if(coreButton){dispatch({type:'DEMO_NEXT'});return;}
        const drawerButton=event.target.closest('.sidebar-toggle,.objects-toggle');if(drawerButton){dispatch({type:'TOGGLE_DRAWER',drawer:drawerButton.matches('.sidebar-toggle')?'left':'right'});return;}
        const outputOpen=event.target.closest('[data-output-open]');if(outputOpen){dispatch({type:'OPEN_OUTPUT',outputId:outputOpen.dataset.outputOpen});return;}
        if(event.target.closest('[data-output-close]')){dispatch({type:'CLOSE_OUTPUT'});return;}
        if(event.target.closest('#pause')){dispatch({type:'TOGGLE_PAUSE'});return;}
        const example=event.target.closest('[data-example]');if(example){dispatch({type:'SET_DRAFT',value:example.dataset.example,focusSelector:'#prompt'});return;}
        const planAction=event.target.closest('[data-plan-action]');if(planAction){
          const actionName=planAction.dataset.planAction;
          if(actionName==='confirm'){dispatch({type:appState.plan?.previousRun?'CONFIRM_RUNNING_CHANGE':'CONFIRM_PLAN',via:'button'});return;}
          if(actionName==='edit'){dispatch({type:'EDIT_PLAN',mode:'open'});return;}
          if(actionName==='cancel'){dispatch({type:appState.plan?.previousRun?'CANCEL_RUNNING_CHANGE':'CANCEL_PLAN'});return;}
          if(actionName==='cancel-edit'){dispatch({type:'EDIT_PLAN',mode:'save'});return;}
          if(actionName==='running-params'){dispatch({type:'SHOW_NOTICE',text:'在输入框追加参数后发送',focusSelector:'#prompt'});return;}
          if(actionName==='cancel-execution'){dispatch({type:'CANCEL_EXECUTION',confirmed:window.confirm('确认取消当前执行？在途结果将只作为历史证据保留。')});return;}
        }
        const action=event.target.closest('[data-demo]');if(!action)return;
        const name=action.dataset.demo;
        if(name==='retry'&&appState.runFlags.degraded){dispatch({type:'OPTIONAL_TOOL_RECOVERED',safeToRetry:true});return;}
        if(name==='retry'&&['failed','timedOut'].includes(appState.runState)){dispatch({type:'RECOVER_EXECUTION',strategy:'retry'});return;}
        if(name==='params'&&appState.runState==='awaitingConfirm'){dispatch({type:'EDIT_PLAN'});return;}
        if(name==='auth'&&appState.runState==='blocked'){dispatch({type:'GENERATE_AUTH_PACKAGE'});return;}
        if(name==='evidence'){dispatch({type:'OPEN_OUTPUT',outputId:'plan-snapshot'});return;}
        dispatch({type:'SHOW_NOTICE',text:noticeFor(name)});
      });
      document.addEventListener('change',event=>{if(event.target.matches('#demo-state'))dispatch({type:'LOAD_FIXTURE',state:event.target.value});});
      const trapRightDrawerTab = event => {
        if(event.key!=='Tab'||!rightMedia.matches||!appState.ui.rightDrawerOpen)return false;
        const panel=document.querySelector('#objects');const items=[...panel.querySelectorAll(focusable)].filter(item=>!item.closest('[inert]'));
        if(!items.length){event.preventDefault();panel.focus();return true;}
        const first=items[0],last=items.at(-1),active=document.activeElement;
        if(!panel.contains(active)||(event.shiftKey&&active===first)){event.preventDefault();last.focus();return true;}
        if(!event.shiftKey&&active===last){event.preventDefault();first.focus();return true;}
        return false;
      };
      document.addEventListener('keydown',event=>{
        if(trapRightDrawerTab(event))return;
        if(event.target.matches('#demo-state')&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){const values=[...URL_STATES];let index=values.indexOf(event.target.value);if(event.key==='Home')index=0;else if(event.key==='End')index=values.length-1;else index=(index+(event.key==='ArrowRight'?1:-1)+values.length)%values.length;event.preventDefault();dispatch({type:'LOAD_FIXTURE',state:values[index],focusSelector:'#demo-state'});return;}
        if(event.key==='Escape'){event.preventDefault();dispatch({type:'CLOSE_ACTIVE_LAYER'});}
      });
      const composer=document.querySelector('#composer');const prompt=document.querySelector('#prompt');
      prompt.addEventListener('input',event=>dispatch({type:'SET_DRAFT',value:event.target.value}));
      prompt.addEventListener('compositionstart',()=>dispatch({type:'SET_COMPOSING',value:true}));
      prompt.addEventListener('compositionend',event=>dispatch({type:'SET_COMPOSING',value:false,valueAfter:event.target.value}));
      const submitDraft = () => {
        const text=prompt.value;
        if(!text.trim()){dispatch({type:'SHOW_NOTICE',text:'请输入需求'});return;}
        if(appState.sessionPhase==='new'){dispatch({type:'FIRST_SUBMIT',text,composing:appState.ui.composing});return;}
        if(appState.runState==='accepting'){dispatch({type:'ACCEPTING_RESUBMIT',text});return;}
        if(appState.runState==='awaitingConfirm'){dispatch({type:appState.plan?.previousRun?'CONFIRM_RUNNING_CHANGE':'CONFIRM_PLAN',text});return;}
        if(appState.runState==='running'){dispatch({type:'ADD_RUNNING_PARAMS',text});return;}
        if(['idle','cancelled','succeeded','failed','timedOut','blocked'].includes(appState.runState)){dispatch({type:'START_NEW_EXECUTION',text});return;}
        dispatch({type:'SHOW_NOTICE',text:'当前状态暂不接收新参数'});
      };
      prompt.addEventListener('keydown',event=>{if(event.key!=='Enter'||event.shiftKey||event.isComposing||appState.ui.composing)return;event.preventDefault();submitDraft();});
      composer.addEventListener('submit',event=>{event.preventDefault();submitDraft();});
      document.addEventListener('submit',event=>{
        if(!event.target.matches('#parameter-form'))return;
        event.preventDefault();dispatch({type:'EDIT_PLAN',mode:'save'});
      });
      leftMedia.addEventListener('change',()=>dispatch({type:'CLOSE_DRAWERS'}));rightMedia.addEventListener('change',()=>dispatch({type:'CLOSE_DRAWERS'}));
      addEventListener('popstate',event=>{if(acceptingTimer){clearTimeout(acceptingTimer);acceptingTimer=null;}const previous=appState;appState=parseQuery(location.search);appState.ui.openedOutputInSession=Boolean(event.state?.openedOutputInSession&&appState.workspaceMode==='outputViewer');render(appState);syncAcceptingTimer();if(previous.workspaceMode!==appState.workspaceMode||outputReturnFocusId)requestAnimationFrame(()=>{const target=appState.workspaceMode==='outputViewer'?document.querySelector('#output-title'):document.querySelector(`[data-output-open="${CSS.escape(outputReturnFocusId||previous.outputId)}"]`)||document.querySelector('.objects-toggle');target?.focus();outputReturnFocusId='';});});
      if(appState.demoControls)Object.defineProperty(window,'__sampleTest',{value:Object.freeze({
        getState:()=>copyState(appState),dispatch:event=>dispatch(copyState(event)),reduce:(state,event)=>assertState(reducer(normalizeState(state),copyState(event))),
        parseQuery,serializeQuery,stateFromUrl,urlStateFrom,normalizeState,assertState,railModel:state=>copyState(rightRailModel(assertState(normalizeState(state)))),transitionEvents:TRANSITION_EVENTS
      }),configurable:false,writable:false});
      render(appState);history.replaceState({sample:true,openedOutputInSession:appState.ui.openedOutputInSession},'',serializeQuery(appState));syncAcceptingTimer();
