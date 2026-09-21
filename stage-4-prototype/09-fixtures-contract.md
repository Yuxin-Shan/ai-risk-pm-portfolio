# 阶段 4 前向 fixture 字段契约

> 口径：本文件冻结批次 1–4 共用的对象 ID、状态枚举、引用字段与确定性跨页快照。数据均为虚构模拟；固定时钟为 `23:08`。页面只通过 `window.RISK_FIXTURES` 读取，不在页面内复制同一对象。

## 1. 全局读取与不可变约定

| 项 | 规范 |
|---|---|
| 全局入口 | `window.RISK_FIXTURES`；属性描述符为 `writable:false`、`configurable:false` |
| 版本 | `version: "1.0"` |
| 固定时钟 | `fixedTime: "23:08"`，所有时间窗引用该值，不使用真实时间 |
| 对象目录 | `RISK_FIXTURES.objects.<collection>[id]` |
| 枚举目录 | `RISK_FIXTURES.enums.<enumName>` |
| 快照读取 | `RISK_FIXTURES.getSnapshot(scenarioId, stage)`；非法组合返回 `null` |
| 跨页参数 | `RISK_FIXTURES.makeQuery(scenarioId, stage, objectId)` 生成 `?scenario=<id>&stage=<stage>&object=<id>` |
| 不可变性 | 枚举、对象、嵌套数组、引用对象、场景快照及公开入口递归 `Object.freeze` |
| 加载方式 | 经典 `<script defer>`；不使用 ES module、网络请求或运行时外部 JSON |

## 2. 枚举契约

| 枚举名 | 允许值 | 用途 |
|---|---|---|
| `listTypes` | `blacklist`、`whitelist` | 名单类型 |
| `effectScopes` | `account`、`merchant`、`transaction` | 名单生效范围 |
| `enabledStates` | `enabled`、`disabled` | 名单启用状态 |
| `featureReleaseStates` | `draft`、`published`、`retired` | 特征上线状态 |
| `datasetVersionStates` | `draft`、`frozen`、`archived` | 数据集版本状态 |
| `agentVersionStates` | `draft`、`validated`、`registered`、`retired` | Agent 版本状态 |
| `toolRegistrationStates` | `draft`、`registered`、`disabled` | 工具注册状态 |
| `authApprovalStates` | `pendingApproval`、`approved`、`rejected`、`expired` | 授权包审批状态 |
| `experimentGateStates` | `pending`、`passed`、`failed`、`insufficient` | 实验门禁状态 |
| `taskStates` | `queued`、`running`、`paused`、`succeeded`、`failed`、`retrying`、`cancelled` | 离线任务状态机 |
| `evidenceResultStates` | `success`、`failed`、`missing` | 证据步骤结果 |
| `reportGateStates` | `passed`、`failed`、`notEvaluated` | 报告四项门禁结果 |
| `strategyLifecycleStates` | `draft`、`active`、`retired` | 策略生命周期 |
| `modelEffectStates` | `pending`、`effective`、`rejected`、`retired` | 模型注册生效状态 |
| `monitorDispositionStates` | `unassigned`、`investigating`、`contained`、`closed` | 监控案件处置状态 |
| `replayStates` | `ready`、`running`、`completed`、`failed` | 日志回放状态 |

## 3. 对象字段契约

| 对象 / 集合 | 字段名与类型 | 枚举与引用关系 | 所属批次 |
|---|---|---|---|
| 名单条目 `listEntries` | `id:string`；`listType:string`；`effectScope:string`；`enabledState:string` | 分别取 `listTypes`、`effectScopes`、`enabledStates` | 1、3 |
| 特征 `features` | `id:string`；`version:string`；`releaseState:string` | `releaseState` 取 `featureReleaseStates` | 1、3 |
| 数据集 `datasets` | `id:string`；`version:string`；`versionState:string`；`annotationSummary:{total:number,positive:number,negative:number}`；`negativeSampleRefs:string[]` | 状态取 `datasetVersionStates`；负样本引用 `monitorCases.id` | 1、2 |
| Agent 版本 `agentVersions` | `id:string`；`status:string`；`toolPermissionRefs:string[]` | 状态取 `agentVersionStates`；权限引用 `authPackages.id` | 1–4 |
| 工具 `tools` | `id:string`；`schemaRef:string`；`registrationState:string` | 状态取 `toolRegistrationStates`；`schemaRef` 为冻结 schema ID | 1–3 |
| 授权包 `authPackages` | `id:string`；`toolId:string`；`schemaRef:string`；`agentVersionId:string`；`approvalStatus:string` | 引用 `tools.id`、`agentVersions.id`；状态取 `authApprovalStates` | 1、3 |
| 实验 `experiments` | `id:string`；`groups:{a,b}`；`gateResults:{sampleCoverage,evidenceCompleteness,unauthorizedCalls,baselineRegression}` | A/B 组引用 `agentVersions.id`；四项结果取 `experimentGateStates` | 2 |
| 任务 `tasks` | `id:string`；`status:string`；`retryCount:number`；`experimentId:string`；`evidenceIds:string[]` | 状态取 `taskStates`；引用 `experiments.id`、`evidence.id` | 2 |
| 证据 `evidence` | `id:string`；`caseId:string`；`step:number`；`durationMs:number`；`resultStatus:string`；`toolId:string` | 状态取 `evidenceResultStates`；引用 `monitorCases.id`、`tools.id` | 2–4 |
| 报告包 `reportPackages` | `id:string`；`experimentId:string`；`gateResults:{sampleCoverage,evidenceCompleteness,unauthorizedCalls,baselineRegression}`；`registrationPackageId:string` | 引用 `experiments.id`；四项结果取 `reportGateStates`；待注册包 ID 供模型服务读取 | 2、3 |
| 策略 `strategies` | `id:string`；`version:string`；`lifecycleState:string`；`ruleRefs:string[]`；`thresholdRefs:string[]` | 状态取 `strategyLifecycleStates`；规则与阈值使用冻结 ID | 3、4 |
| 模型注册 `modelRegistrations` | `id:string`；`version:string`；`agentVersionId:string`；`registrationPackageId:string`；`effectStatus:string` | 引用 `agentVersions.id`、`reportPackages.registrationPackageId`；状态取 `modelEffectStates` | 3 |
| 监控案件 `monitorCases` | `id:string`；`timeWindow:{start,end}`；`metrics:{riskHits,manualReviews}`；`dispositionStatus:string`；`strategyVersionId:string` | 状态取 `monitorDispositionStates`；引用 `strategies.id` | 3、4 |
| 日志回放窗口 `replayWindows` | `id:string`；`timeWindow:{start,end}`；`caseId:string`；`strategyVersionId:string`；`replayState:string` | 状态取 `replayStates`；引用 `monitorCases.id`、`strategies.id` | 4 |

## 4. 确定性对象 ID

| 对象 | 固定 ID |
|---|---|
| 名单条目 | `LIST-1001` |
| 特征 | `FEATURE-RISK-VELOCITY` / `v3` |
| 数据集 | `DATASET-RISK-Q3` / `v4` |
| Agent 版本 | `AGENT-OPS-V3.2` |
| 工具 / schema / 授权包 | `TOOL-EVIDENCE-01` / `SCHEMA-EVIDENCE-V2` / `AUTH-204` |
| 实验 / 任务 / 证据 | `EXPERIMENT-2317` / `TASK-882` / `EVIDENCE-88209` |
| 报告 / 待注册包 / 模型注册 | `REPORT-4517` / `REGISTER-4517` / `MODEL-OPS-V3.2` |
| 策略 / 案件 / 回放窗口 | `STRATEGY-19-V5` / `CASE-4517` / `REPLAY-4517` |

## 5. 跨页因果快照

### 5.1 快照通用字段

| 字段 | 类型 | 规范 |
|---|---|---|
| `scenarioId` | `string` | 三条账本链之一 |
| `stage` | `string` | 必须属于该链的 `scenarioStages` |
| `phase` | `"before" \| "after"` | 标识前态或后态 |
| `fixedTime` | `string` | 恒为 `23:08` |
| `objectId` | `string` | URL `object` 参数的默认目标 |
| `refs` | `object` | 跨页继承的稳定对象 ID |
| `state` | `object` | 当前阶段的可断言状态与确定性数字 |

### 5.2 三条账本链

| 因果链 / AC | 合法 stage | before 快照 | after 快照 | 核心断言 |
|---|---|---|---|---|
| 工具授权 / AC-09 | `pendingApproval`、`approved`、`called` | `pendingApproval` | `approved`、`called` | 批准前指定 Agent 与其他 Agent 均不可调用；批准后仅指定 Agent 可调用；调用后记录数为 1 且证据结果为 `success` |
| Agent 注册 / AC-13 | `packageGenerated`、`registered`、`monitored` | `packageGenerated` | `registered`、`monitored` | 四门禁通过才有待注册包；人工注册后模型生效；进入监控后显示固定指标 |
| 三线衔接 / AC-15 | `before`、`after` | `before` | `after` | 同一组授权包、报告包、Agent、策略、案件与回放 ID 从未衔接推进为授权、注册、回放完成 |

三条链合计 3 条 `before` 快照、5 条 `after` 快照。刷新、后退和直接链接均按 `scenarioId + stage + objectId` 读取同一冻结快照；fixture 不代表真实线上授权、注册或监控证据。

## 6. 页面读取边界

- 页面 URL 只携带 `scenario`、`stage`、`object`，不在查询参数中复制对象正文或状态。
- 页面 reducer 只产生下一合法 `stage` 和下一页链接；render 只读取对应快照。
- 页面不得修改 `RISK_FIXTURES`、在私有变量中复制同 ID 对象，或以真实时间、随机数和网络结果覆盖快照。
- 批次 1 只消费名单、特征、数据集、Agent、工具和授权包字段；批次 2–4 的字段保持前向冻结，不提前生成对应页面或交互。
