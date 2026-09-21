# 阶段 4 信息架构与页面流程图

> 项目属性：个人作品；全部业务情境、对象、指标与数字均为虚构模拟。本文只描述原型的信息组织与确定性页面流转。

## 1. 信息架构

| 一级区域 | 页面 | 主要对象 | 主要去向 |
|---|---|---|---|
| 主工作台 | 对话操作台 | 会话、计划、任务、最新产出 | 实验、任务、证据、报告 |
| 离线验证 | 实验管理、Agent 配置、工具台、任务队列、证据链视图、验证报告 | Agent 版本、工具授权包、实验、任务、证据、报告包 | 模型服务 |
| 在线风控 | 策略引擎配置、模型服务、实时监控 | 策略版本、授权包、注册包、监控案件 | 日志回放、数据集管理 |
| 基础资产 | 名单管理、特征发布、数据集管理 | 名单、特征、数据集版本与负样本 | 策略、实验 |
| 排查 | 日志回放 | 回放窗口、案件、策略、证据 | 策略配置、Agent 配置 |

## 2. 页面流程

```text
对话操作台
  ├─ Agent 配置 → 工具台 → 模型服务人工批准 → 证据链视图
  ├─ 实验管理 → 任务队列 → 证据链视图 → 验证报告
  │                                      └→ 模型服务人工注册 → 实时监控
  └─ 策略引擎配置 → 实时监控 → 数据集管理（抽检负样本）
                              └→ 日志回放 → 策略 / Agent 配置
```

## 3. 三条跨页因果链

| 链 | 前态入口 | 人工动作 | 后态入口 | 固定对象 |
|---|---|---|---|---|
| 工具授权 / AC-09 | `toolbench.html?scenario=tool-authorization&stage=pendingApproval&object=AUTH-204` | 模型服务批准 | `toolbench.html?scenario=tool-authorization&stage=called&object=EVIDENCE-88209` | `AUTH-204`、`EVIDENCE-88209` |
| Agent 注册 / AC-13 | `validation-report.html?scenario=agent-registration&stage=packageGenerated&object=REGISTER-4517` | 模型服务注册 | `realtime-monitor.html?scenario=agent-registration&stage=monitored&object=CASE-4517` | `REGISTER-4517`、`CASE-4517` |
| 三线衔接 / AC-15 | `log-replay.html?scenario=three-line-handoff&stage=before&object=CASE-4517` | 按固定链接推进 | `log-replay.html?scenario=three-line-handoff&stage=after&object=REPLAY-4517` | `STRATEGY-19-V5`、`REPLAY-4517` |

## 4. 导航规则

- 对话操作台提供全部 13 个编号界面的入口；当前页使用 `aria-current="page"`。
- 新增的批次 2–4 页面均显示 14 个页面入口；批次 1 页面保留其已验收导航结构。
- 页面路由使用独立 HTML；查询参数仅表达主题、页内状态和确定性账本快照。
