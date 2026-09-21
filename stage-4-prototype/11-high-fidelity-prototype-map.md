# 阶段 4 高保真原型与映射表

> 页面均可通过 `file://` 离线打开；固定可见「个人作品 · 虚构模拟数据」。外部网络、真实授权、真实注册和真实在线写入均不在原型能力范围内。

## 1. 原型映射

| # | 页面 | 文件 | 主承载 AC | 主状态 | 正式截图 |
|---:|---|---|---|---|---|
| — | 对话操作台 | `prototype/samples/sample-dialog.html` | AC-05、AC-06 | `running` | `stage-4-prototype/screenshots/sample-light-running.png` |
| 1 | 策略引擎配置 | `prototype/pages/strategy-engine.html` | AC-01、AC-02 | `active` | `prototype/screenshots/strategy-engine.png` |
| 2 | 名单管理 | `prototype/pages/lists.html` | AC-02（支撑） | `enabled` | `prototype/screenshots/lists.png` |
| 3 | 特征发布 | `prototype/pages/features.html` | 基础资产 | `published` | `prototype/screenshots/features.png` |
| 4 | 模型服务 | `prototype/pages/model-service.html` | AC-09、AC-13 | `pending` | `prototype/screenshots/model-service.png` |
| 5 | 实时监控 | `prototype/pages/realtime-monitor.html` | AC-03、04、12、16 | `investigating` | `prototype/screenshots/realtime-monitor.png` |
| 6 | 实验管理 | `prototype/pages/experiment-management.html` | AC-07 | `pending` | `prototype/screenshots/experiment-management.png` |
| 7 | Agent 配置 | `prototype/pages/agent-config.html` | AC-08 | `validated` | `prototype/screenshots/agent-config.png` |
| 8 | 工具台 | `prototype/pages/toolbench.html` | AC-09 | `pendingApproval` | `prototype/screenshots/toolbench.png` |
| 9 | 任务队列 | `prototype/pages/task-queue.html` | AC-10 | `running` | `prototype/screenshots/task-queue.png` |
| 10 | 证据链视图 | `prototype/pages/evidence-chain.html` | AC-11 | `success` | `prototype/screenshots/evidence-chain.png` |
| 11 | 验证报告 | `prototype/pages/validation-report.html` | AC-13 | `passed` | `prototype/screenshots/validation-report.png` |
| 12 | 数据集管理 | `prototype/pages/datasets.html` | AC-04、AC-07（支撑） | `frozen` | `prototype/screenshots/datasets.png` |
| 13 | 日志回放 | `prototype/pages/log-replay.html` | AC-14 | `ready` | `prototype/screenshots/log-replay.png` |

## 2. 共享资源边界

| 资源 | 职责 | 影响页 |
|---|---|---|
| `tokens.css`、`base.css`、`shell.css`、`components.css` | 冻结 token、通用壳、基础组件 | 14 页 |
| `operations-suite.css` | 批次 2–4 的卡片、表格、指标、步骤、时间线 | 新增 8 页 |
| `fixtures.js` | 冻结对象、枚举、时钟和跨页快照 | 14 页，只读 |
| `operations-suite.js` | 新增 8 页各自 reducer、render、导航、URL 状态 | 新增 8 页 |

## 3. 验收入口

- P0：`node prototype/tests/p0-regression.mjs ...`
- 批次 1 A：`node prototype/tests/batch1-a-pages.mjs ...`
- 批次 1 B：`node prototype/tests/batch1-b-pages.mjs ...`
- 批次 2–4：`node prototype/tests/stage4-regression.mjs ...`
- `stage4-cases.json` 的 26 条用例逐项覆盖新增页面主动作、异常态、URL 直达、键盘路径及三条跨页账本。

