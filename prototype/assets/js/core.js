      const copyState = state => structuredClone(state);
      const finishTransition = state => {
        const next=copyState(state);next.updatedAt=FIXED_TIME;
        if(TERMINAL_STATES.has(next.runState))next.runFlags.degraded=false;
        return next;
      };
      const normalizeState = candidate => {
        const seed=initialState();
        const next={...seed,...copyState(candidate||{}),runFlags:{...seed.runFlags,...(candidate?.runFlags||{})},ui:{...seed.ui,...(candidate?.ui||{})}};
        if(!THEMES.has(next.theme))next.theme='dark';
        if(!SESSION_PHASES.has(next.sessionPhase))next.sessionPhase='active';
        if(!RUN_STATES.has(next.runState))next.runState='running';
        if(!WORKSPACE_MODES.has(next.workspaceMode))next.workspaceMode='conversation';
        if(next.sessionPhase==='new')next.runState='idle';
        if(next.runState!=='running')next.runFlags.degraded=false;
        if(next.workspaceMode==='outputViewer'&&!next.outputId)next.workspaceMode='conversation';
        next.currentStep=Number.isInteger(next.currentStep)?Math.max(0,Math.min(4,next.currentStep)):0;
        next.updatedAt=FIXED_TIME;
        return next;
      };
      const assertState = state => {
        if(!SESSION_PHASES.has(state.sessionPhase))throw new Error(`invalid sessionPhase: ${state.sessionPhase}`);
        if(!RUN_STATES.has(state.runState))throw new Error(`invalid runState: ${state.runState}`);
        if(!WORKSPACE_MODES.has(state.workspaceMode))throw new Error(`invalid workspaceMode: ${state.workspaceMode}`);
        if(state.sessionPhase==='new'&&state.runState!=='idle')throw new Error('new session must be idle');
        if(state.runFlags.degraded&&state.runState!=='running')throw new Error('degraded flag requires running');
        if(state.workspaceMode==='outputViewer'&&!state.outputId)throw new Error('outputViewer requires outputId');
        if(state.updatedAt!==FIXED_TIME)throw new Error('fixture clock drifted');
        return state;
      };
      const stateFromUrl = (value, base=initialState()) => {
        const next={...copyState(base),sessionPhase:'active',runFlags:{degraded:false},workspaceMode:'conversation',outputId:'',ui:{...emptyUi(),composing:base.ui?.composing||false}};
        switch(URL_STATES.has(value)?value:'normal'){
          case 'empty':next.sessionPhase='new';next.runState='idle';next.currentStep=0;next.plan=null;next.latestOutput=null;next.objects=[];break;
          case 'loading':next.runState='accepting';next.currentStep=0;next.plan=null;next.latestOutput=null;next.objects=[];break;
          case 'confirm':next.runState='awaitingConfirm';next.currentStep=0;next.plan={id:'plan-v2',confirmed:false,previousRun:null};next.latestOutput=null;next.objects=[];break;
          case 'paused':next.runState='paused';next.currentStep=2;break;
          case 'completed':next.runState='succeeded';next.currentStep=4;next.objects=['#E-2317','#T-882','#TR-88209','#R-4517'];break;
          case 'error':next.runState='failed';next.currentStep=3;break;
          case 'timeout':next.runState='timedOut';next.currentStep=2;break;
          case 'unauthorized':next.runState='blocked';next.currentStep=0;next.plan=null;next.latestOutput=null;next.objects=[];break;
          case 'degraded':next.runState='running';next.currentStep=2;next.runFlags.degraded=true;break;
          default:next.runState='running';next.currentStep=2;
        }
        return finishTransition(next);
      };
      const urlStateFrom = state => {
        if(state.sessionPhase==='new')return 'empty';
        if(state.runState==='accepting')return 'loading';
        if(state.runState==='awaitingConfirm')return 'confirm';
        if(state.runState==='paused')return 'paused';
        if(state.runState==='succeeded')return 'completed';
        if(state.runState==='failed')return 'error';
        if(state.runState==='timedOut')return 'timeout';
        if(state.runState==='blocked')return 'unauthorized';
        if(state.runState==='running'&&state.runFlags.degraded)return 'degraded';
        return 'normal';
      };
      const parseQuery = (search=location.search) => {
        const query=new URLSearchParams(search);const base=stateFromUrl(query.get('state'));
        base.theme=THEMES.has(query.get('theme'))?query.get('theme'):'dark';
        base.demoControls=query.get('demo-controls')==='1';
        const requestedMode=query.get('mode');const output=query.get('output')||'';
        base.workspaceMode=requestedMode==='output'&&output?'outputViewer':'conversation';base.outputId=base.workspaceMode==='outputViewer'?output:'';
        return assertState(normalizeState(base));
      };
      const serializeQuery = state => {
        const query=new URLSearchParams();query.set('theme',state.theme);query.set('state',urlStateFrom(state));
        if(state.workspaceMode==='outputViewer'){query.set('mode','output');query.set('output',state.outputId);}
        if(state.demoControls)query.set('demo-controls','1');
        return `?${query}`;
      };
      const reducer = (state,event) => {
        let next=copyState(state);const text=String(event.text||'').trim();
        switch(event.type){
          case 'OPEN_NEW_SESSION':next={...initialState(),theme:state.theme,demoControls:state.demoControls,sessionPhase:'new',runState:'idle',currentStep:0,plan:null,latestOutput:null,objects:[],ui:emptyUi()};break;
          case 'FIRST_SUBMIT':if(state.sessionPhase==='new'&&state.runState==='idle'&&text&&!event.composing){next.sessionPhase='active';next.runState='accepting';next.messages.push({role:'user',text});next.draftText=event.text;next.plan=null;next.objects=[];}break;
          case 'ACCEPTING_RESUBMIT':if(state.runState==='accepting'&&text){next.messages.push({role:'user',text});next.draftText=event.text;}break;
          case 'ACCEPTING_COMPLETE':if(state.runState==='accepting'){next.runState='awaitingConfirm';next.plan={id:'plan-v2',confirmed:false,previousRun:null};}break;
          case 'CONFIRM_PLAN':if(state.runState==='awaitingConfirm'&&!state.plan?.previousRun&&(event.via==='button'||['确认','确认执行'].includes(text))){next.runState='running';next.currentStep=2;next.plan={...state.plan,confirmed:true};next.ui.editingPlan=false;next.objects=['#E-2317','#T-882','#TR-88209'];next.latestOutput={id:'plan-snapshot'};}break;
          case 'EDIT_PLAN':if(state.runState==='awaitingConfirm')next.ui.editingPlan=event.mode==='save'?false:true;break;
          case 'CANCEL_PLAN':if(state.runState==='awaitingConfirm'&&!state.plan?.previousRun){next.runState='cancelled';next.plan={...state.plan,cancelled:true};next.ui.editingPlan=false;next.objects=[];}break;
          case 'START_NEW_EXECUTION':if(['idle','cancelled','succeeded','failed','timedOut','blocked'].includes(state.runState)&&text){next.sessionPhase='active';next.runState='accepting';next.messages.push({role:'user',text});next.draftText=event.text;next.plan=null;next.currentStep=0;next.objects=state.objects.slice();}break;
          case 'ASK_READ_ONLY':if(TERMINAL_STATES.has(state.runState)&&text){next.runState='idle';next.messages.push({role:'user',text});next.draftText='';next.plan=null;}break;
          case 'ADD_RUNNING_PARAMS':if(state.runState==='running'&&text){next.runState='awaitingConfirm';next.plan={id:'change-plan',confirmed:false,previousRun:{currentStep:state.currentStep,runFlags:copyState(state.runFlags)}};next.messages.push({role:'user',text});next.draftText=event.text;}break;
          case 'CONFIRM_RUNNING_CHANGE':if(state.runState==='awaitingConfirm'&&state.plan?.previousRun&&(event.via==='button'||['确认','确认执行'].includes(text))){next.runState='running';next.currentStep=state.plan.previousRun.currentStep;next.plan={...state.plan,confirmed:true,previousRun:null};next.ui.editingPlan=false;}break;
          case 'CANCEL_RUNNING_CHANGE':if(state.runState==='awaitingConfirm'&&state.plan?.previousRun){next.runState='running';next.currentStep=state.plan.previousRun.currentStep;next.runFlags=copyState(state.plan.previousRun.runFlags);next.plan={id:'plan-v2',confirmed:true,previousRun:null};next.ui.editingPlan=false;}break;
          case 'TOGGLE_PAUSE':if(state.runState==='running')next.runState='paused';else if(state.runState==='paused')next.runState='running';break;
          case 'CANCEL_EXECUTION':if(['running','paused'].includes(state.runState)&&event.confirmed){next.runState='cancelled';next.executionSteps.push({type:'cancel-request',lateResults:'evidence-only'});}break;
          case 'OPTIONAL_TOOL_FAILED':if(state.runState==='running'&&event.optional){next.runFlags.degraded=true;next.executionSteps.push({type:'optional-failure'});}break;
          case 'OPTIONAL_TOOL_RECOVERED':if(state.runState==='running'&&state.runFlags.degraded&&event.safeToRetry){next.runFlags.degraded=false;next.executionSteps.push({type:'optional-recovered'});}break;
          case 'REQUIRED_STEP_OUTCOME':if(state.runState==='running'&&['failed','timedOut'].includes(event.outcome))next.runState=event.outcome;break;
          case 'ACCEPTANCE_BLOCKED':if(state.runState==='accepting'&&event.reason)next.runState='blocked';break;
          case 'RECOVER_EXECUTION':if(['failed','timedOut'].includes(state.runState)&&event.strategy){next.runState='running';next.executionSteps.push({type:'recovered',strategy:event.strategy});}break;
          case 'GENERATE_AUTH_PACKAGE':if(state.runState==='blocked'&&!state.objects.includes('#P-204'))next.objects.push('#P-204');break;
          case 'AUTH_APPROVED':if(state.runState==='blocked'&&event.approved&&event.requestValid){next.runState='accepting';next.plan=null;next.currentStep=0;}break;
          case 'COMPLETE_EXECUTION':if(state.runState==='running'&&event.completedSteps===event.totalSteps){next.runState='succeeded';next.currentStep=4;next.latestOutput={id:'R-4517'};next.objects=['#E-2317','#T-882','#TR-88209','#R-4517'];}break;
          case 'OPEN_OUTPUT':if(event.outputId&&(state.sessionPhase!=='new'||event.directLink)){next.workspaceMode='outputViewer';next.outputId=event.outputId;next.ui.openedOutputInSession=!event.directLink;}break;
          case 'CLOSE_OUTPUT':if(state.workspaceMode==='outputViewer'){next.workspaceMode='conversation';next.outputId='';next.ui.openedOutputInSession=false;}break;
          case 'SET_THEME':if(THEMES.has(event.theme))next.theme=event.theme;break;
          case 'LOAD_FIXTURE':next=stateFromUrl(event.state);next.theme=state.theme;next.demoControls=state.demoControls;break;
          case 'SET_DRAFT':next.draftText=event.value;break;
          case 'SET_COMPOSING':next.ui.composing=Boolean(event.value);break;
          case 'SHOW_NOTICE':next.ui.notice=event.text||'';break;
          case 'CLEAR_NOTICE':next.ui.notice='';break;
          case 'TOGGLE_DRAWER':if(event.drawer==='left')next.ui.leftDrawerOpen=!state.ui.leftDrawerOpen;if(event.drawer==='right')next.ui.rightDrawerOpen=!state.ui.rightDrawerOpen;break;
          case 'CLOSE_ACTIVE_LAYER':if(state.ui.rightDrawerOpen)next.ui.rightDrawerOpen=false;else if(state.ui.leftDrawerOpen)next.ui.leftDrawerOpen=false;else if(state.workspaceMode==='outputViewer'){next.workspaceMode='conversation';next.outputId='';}break;
          case 'CLOSE_DRAWERS':next.ui.leftDrawerOpen=false;next.ui.rightDrawerOpen=false;break;
          case 'DEMO_NEXT':if(state.runState==='accepting')return reducer(state,{type:'ACCEPTING_COMPLETE'});if(state.runState==='awaitingConfirm')return reducer(state,{type:state.plan?.previousRun?'CONFIRM_RUNNING_CHANGE':'CONFIRM_PLAN',via:'button'});if(state.runState==='running')return reducer(state,{type:'COMPLETE_EXECUTION',completedSteps:4,totalSteps:4});break;
        }
        return assertState(finishTransition(normalizeState(next)));
      };
      let appState=parseQuery();appState.ui.openedOutputInSession=Boolean(history.state?.openedOutputInSession&&appState.workspaceMode==='outputViewer');let acceptingTimer=null;let noticeTimer=null;let outputReturnFocusId='';
