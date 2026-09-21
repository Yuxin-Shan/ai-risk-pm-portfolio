      const FIXED_TIME = '23:08';
      const SESSION_PHASES = new Set(['new','active']);
      const RUN_STATES = new Set(['idle','accepting','awaitingConfirm','running','paused','cancelled','succeeded','failed','timedOut','blocked']);
      const WORKSPACE_MODES = new Set(['conversation','outputViewer']);
      const TERMINAL_STATES = new Set(['cancelled','succeeded','failed','timedOut','blocked']);
      const THEMES = new Set(['dark','light']);
      const URL_STATES = new Set(['empty','loading','confirm','normal','paused','completed','error','timeout','unauthorized','degraded']);
      const TRANSITION_EVENTS = Object.freeze([
        'OPEN_NEW_SESSION','FIRST_SUBMIT','ACCEPTING_RESUBMIT','ACCEPTING_COMPLETE','CONFIRM_PLAN','EDIT_PLAN',
        'CANCEL_PLAN','START_NEW_EXECUTION','ASK_READ_ONLY','ADD_RUNNING_PARAMS','CONFIRM_RUNNING_CHANGE',
        'CANCEL_RUNNING_CHANGE','TOGGLE_PAUSE','CANCEL_EXECUTION','OPTIONAL_TOOL_FAILED','OPTIONAL_TOOL_RECOVERED',
        'REQUIRED_STEP_OUTCOME','ACCEPTANCE_BLOCKED','RECOVER_EXECUTION','GENERATE_AUTH_PACKAGE','AUTH_APPROVED',
        'COMPLETE_EXECUTION','OPEN_OUTPUT','CLOSE_OUTPUT'
      ]);
      const emptyUi = () => ({leftDrawerOpen:false,rightDrawerOpen:false,editingPlan:false,notice:'',openedOutputInSession:false,composing:false});
      const initialState = () => ({
        theme:'dark',sessionPhase:'active',runState:'running',runFlags:{degraded:false},workspaceMode:'conversation',
        currentStep:2,updatedAt:FIXED_TIME,draftText:'',messages:[],plan:{id:'plan-v2',confirmed:true,previousRun:null},
        executionSteps:[],latestOutput:{id:'plan-snapshot'},objects:['#E-2317','#T-882','#TR-88209'],outputId:'',
        demoControls:false,ui:emptyUi()
      });

      const freezeFixtureValue = value => {
        if(value&&(typeof value==='object'||typeof value==='function')&&!Object.isFrozen(value)){
          Object.values(value).forEach(freezeFixtureValue);Object.freeze(value);
        }
        return value;
      };
      const FIXTURE_ENUMS = freezeFixtureValue({
        listTypes:['blacklist','whitelist'],
        effectScopes:['account','merchant','transaction'],
        enabledStates:['enabled','disabled'],
        featureReleaseStates:['draft','published','retired'],
        datasetVersionStates:['draft','frozen','archived'],
        agentVersionStates:['draft','validated','registered','retired'],
        toolRegistrationStates:['draft','registered','disabled'],
        authApprovalStates:['pendingApproval','approved','rejected','expired'],
        experimentGateStates:['pending','passed','failed','insufficient'],
        taskStates:['queued','running','paused','succeeded','failed','retrying','cancelled'],
        evidenceResultStates:['success','failed','missing'],
        reportGateStates:['passed','failed','notEvaluated'],
        strategyLifecycleStates:['draft','active','retired'],
        modelEffectStates:['pending','effective','rejected','retired'],
        monitorDispositionStates:['unassigned','investigating','contained','closed'],
        replayStates:['ready','running','completed','failed']
      });
      const FIXTURE_OBJECTS = freezeFixtureValue({
        listEntries:{
          'LIST-1001':{id:'LIST-1001',listType:'blacklist',effectScope:'account',enabledState:'enabled'}
        },
        features:{
          'FEATURE-RISK-VELOCITY':{id:'FEATURE-RISK-VELOCITY',version:'v3',releaseState:'published'}
        },
        datasets:{
          'DATASET-RISK-Q3':{id:'DATASET-RISK-Q3',version:'v4',versionState:'frozen',annotationSummary:{total:120,positive:24,negative:96},negativeSampleRefs:['CASE-4517']}
        },
        agentVersions:{
          'AGENT-OPS-V3.2':{id:'AGENT-OPS-V3.2',status:'validated',toolPermissionRefs:['AUTH-204']}
        },
        tools:{
          'TOOL-EVIDENCE-01':{id:'TOOL-EVIDENCE-01',schemaRef:'SCHEMA-EVIDENCE-V2',registrationState:'registered'}
        },
        authPackages:{
          'AUTH-204':{id:'AUTH-204',toolId:'TOOL-EVIDENCE-01',schemaRef:'SCHEMA-EVIDENCE-V2',agentVersionId:'AGENT-OPS-V3.2',approvalStatus:'pendingApproval'}
        },
        experiments:{
          'EXPERIMENT-2317':{id:'EXPERIMENT-2317',groups:{a:{agentVersionId:'AGENT-OPS-V3.1'},b:{agentVersionId:'AGENT-OPS-V3.2'}},gateResults:{sampleCoverage:'passed',evidenceCompleteness:'passed',unauthorizedCalls:'passed',baselineRegression:'passed'}}
        },
        tasks:{
          'TASK-882':{id:'TASK-882',status:'running',retryCount:1,experimentId:'EXPERIMENT-2317',evidenceIds:['EVIDENCE-88209']}
        },
        evidence:{
          'EVIDENCE-88209':{id:'EVIDENCE-88209',caseId:'CASE-4517',step:2,durationMs:184,resultStatus:'success',toolId:'TOOL-EVIDENCE-01'}
        },
        reportPackages:{
          'REPORT-4517':{id:'REPORT-4517',experimentId:'EXPERIMENT-2317',gateResults:{sampleCoverage:'passed',evidenceCompleteness:'passed',unauthorizedCalls:'passed',baselineRegression:'passed'},registrationPackageId:'REGISTER-4517'}
        },
        strategies:{
          'STRATEGY-19-V5':{id:'STRATEGY-19-V5',version:'v5',lifecycleState:'active',ruleRefs:['RULE-VELOCITY-07'],thresholdRefs:['THRESHOLD-VELOCITY-03']}
        },
        modelRegistrations:{
          'MODEL-OPS-V3.2':{id:'MODEL-OPS-V3.2',version:'v3.2',agentVersionId:'AGENT-OPS-V3.2',registrationPackageId:'REGISTER-4517',effectStatus:'pending'}
        },
        monitorCases:{
          'CASE-4517':{id:'CASE-4517',timeWindow:{start:'22:50',end:FIXED_TIME},metrics:{riskHits:12,manualReviews:3},dispositionStatus:'investigating',strategyVersionId:'STRATEGY-19-V5'}
        },
        replayWindows:{
          'REPLAY-4517':{id:'REPLAY-4517',timeWindow:{start:'22:50',end:FIXED_TIME},caseId:'CASE-4517',strategyVersionId:'STRATEGY-19-V5',replayState:'ready'}
        }
      });
      const SCENARIO_STAGES = freezeFixtureValue({
        toolAuthorization:['pendingApproval','approved','called'],
        agentRegistration:['packageGenerated','registered','monitored'],
        threeLineHandoff:['before','after']
      });
      const SCENARIO_SNAPSHOTS = freezeFixtureValue({
        'tool-authorization':{
          pendingApproval:{scenarioId:'tool-authorization',stage:'pendingApproval',phase:'before',fixedTime:FIXED_TIME,objectId:'AUTH-204',refs:{toolId:'TOOL-EVIDENCE-01',agentVersionId:'AGENT-OPS-V3.2',authPackageId:'AUTH-204',caseId:'CASE-4517',evidenceId:'EVIDENCE-88209'},state:{approvalStatus:'pendingApproval',authorizedAgentIds:[],canCall:false,otherAgentCanCall:false,callRecordCount:0}},
          approved:{scenarioId:'tool-authorization',stage:'approved',phase:'after',fixedTime:FIXED_TIME,objectId:'AUTH-204',refs:{toolId:'TOOL-EVIDENCE-01',agentVersionId:'AGENT-OPS-V3.2',authPackageId:'AUTH-204',caseId:'CASE-4517',evidenceId:'EVIDENCE-88209'},state:{approvalStatus:'approved',authorizedAgentIds:['AGENT-OPS-V3.2'],canCall:true,otherAgentCanCall:false,callRecordCount:0}},
          called:{scenarioId:'tool-authorization',stage:'called',phase:'after',fixedTime:FIXED_TIME,objectId:'EVIDENCE-88209',refs:{toolId:'TOOL-EVIDENCE-01',agentVersionId:'AGENT-OPS-V3.2',authPackageId:'AUTH-204',caseId:'CASE-4517',evidenceId:'EVIDENCE-88209'},state:{approvalStatus:'approved',authorizedAgentIds:['AGENT-OPS-V3.2'],canCall:true,otherAgentCanCall:false,callRecordCount:1,resultStatus:'success'}}
        },
        'agent-registration':{
          packageGenerated:{scenarioId:'agent-registration',stage:'packageGenerated',phase:'before',fixedTime:FIXED_TIME,objectId:'REGISTER-4517',refs:{reportId:'REPORT-4517',registrationPackageId:'REGISTER-4517',agentVersionId:'AGENT-OPS-V3.2',modelRegistrationId:'MODEL-OPS-V3.2'},state:{gatesPassed:true,effectStatus:'pending',visibleInMonitor:false}},
          registered:{scenarioId:'agent-registration',stage:'registered',phase:'after',fixedTime:FIXED_TIME,objectId:'MODEL-OPS-V3.2',refs:{reportId:'REPORT-4517',registrationPackageId:'REGISTER-4517',agentVersionId:'AGENT-OPS-V3.2',modelRegistrationId:'MODEL-OPS-V3.2'},state:{gatesPassed:true,effectStatus:'effective',visibleInMonitor:false}},
          monitored:{scenarioId:'agent-registration',stage:'monitored',phase:'after',fixedTime:FIXED_TIME,objectId:'CASE-4517',refs:{reportId:'REPORT-4517',registrationPackageId:'REGISTER-4517',agentVersionId:'AGENT-OPS-V3.2',modelRegistrationId:'MODEL-OPS-V3.2',monitorCaseId:'CASE-4517'},state:{gatesPassed:true,effectStatus:'effective',visibleInMonitor:true,metrics:{riskHits:12,manualReviews:3}}}
        },
        'three-line-handoff':{
          before:{scenarioId:'three-line-handoff',stage:'before',phase:'before',fixedTime:FIXED_TIME,objectId:'CASE-4517',refs:{authPackageId:'AUTH-204',reportId:'REPORT-4517',registrationPackageId:'REGISTER-4517',agentVersionId:'AGENT-OPS-V3.2',strategyVersionId:'STRATEGY-19-V5',monitorCaseId:'CASE-4517',replayWindowId:'REPLAY-4517'},state:{toolAuthorized:false,agentRegistered:false,replayState:'ready'}},
          after:{scenarioId:'three-line-handoff',stage:'after',phase:'after',fixedTime:FIXED_TIME,objectId:'REPLAY-4517',refs:{authPackageId:'AUTH-204',reportId:'REPORT-4517',registrationPackageId:'REGISTER-4517',agentVersionId:'AGENT-OPS-V3.2',strategyVersionId:'STRATEGY-19-V5',monitorCaseId:'CASE-4517',replayWindowId:'REPLAY-4517'},state:{toolAuthorized:true,agentRegistered:true,replayState:'completed'}}
        }
      });
      const getFixtureSnapshot = (scenarioId,stage) => SCENARIO_SNAPSHOTS[scenarioId]?.[stage]||null;
      const makeFixtureQuery = (scenarioId,stage,objectId) => `?scenario=${encodeURIComponent(scenarioId)}&stage=${encodeURIComponent(stage)}&object=${encodeURIComponent(objectId)}`;
      const RISK_FIXTURES = freezeFixtureValue({
        version:'1.0',fixedTime:FIXED_TIME,enums:FIXTURE_ENUMS,objects:FIXTURE_OBJECTS,
        scenarioStages:SCENARIO_STAGES,scenarios:SCENARIO_SNAPSHOTS,getSnapshot:getFixtureSnapshot,makeQuery:makeFixtureQuery
      });
      Object.defineProperty(window,'RISK_FIXTURES',{value:RISK_FIXTURES,writable:false,configurable:false,enumerable:true});
