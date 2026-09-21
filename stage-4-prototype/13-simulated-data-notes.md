# 阶段 4 模拟数据说明

## 1. 数据性质

本原型的业务情境、案件、对象、指标、阈值、时间、版本与结果均为虚构模拟。固定时钟为 `23:08`；页面不读取网络、真实日志或真实生产数据。

## 2. 冻结对象

| 类别 | 固定对象 | 用途 |
|---|---|---|
| 基础资产 | `LIST-1001`、`FEATURE-RISK-VELOCITY`、`DATASET-RISK-Q3` | 策略名单、特征版本、实验集与负样本引用 |
| Agent 与工具 | `AGENT-OPS-V3.2`、`TOOL-EVIDENCE-01`、`AUTH-204` | 版本、schema、授权前后态 |
| 离线验证 | `EXPERIMENT-2317`、`TASK-882`、`EVIDENCE-88209`、`REPORT-4517` | 实验、重试、证据与报告 |
| 在线发布 | `REGISTER-4517`、`MODEL-OPS-V3.2` | 人工注册演示 |
| 在线与排查 | `STRATEGY-19-V5`、`CASE-4517`、`REPLAY-4517` | 策略、监控案件与日志回放 |

字段与枚举正本为 `stage-4-prototype/09-fixtures-contract.md` 和 `prototype/assets/js/fixtures.js`；页面只读消费 `window.RISK_FIXTURES`。

## 3. 确定性派生值

- 数据集样本量：120；正样本 24；负样本 96。
- 实验主态样本覆盖：80%；证据链完整：92%；未授权调用：0；相对基线退化：3%。这些是原型显示值，不是实测基线。
- 监控主态从冻结对象派生：风险命中 12、人工复核 3、证据步骤耗时 184ms、时间窗 22:50–23:08；其余比例只用于界面演示。
- 日志回放只显示固定时间线；缺失或超期时不补造步骤，也不呈现模型内部推理。

## 4. 三条账本链

| `scenarioId` | before | after | 证明范围 |
|---|---|---|---|
| `tool-authorization` | `pendingApproval` | `approved`、`called` | 确定性授权与调用记录演示 |
| `agent-registration` | `packageGenerated` | `registered`、`monitored` | 确定性注册与监控可见演示 |
| `three-line-handoff` | `before` | `after` | 三条线对象 ID 一致性演示 |

这些快照不证明真实权限强制、真实注册、真实监控效果或真实数据一致性。

