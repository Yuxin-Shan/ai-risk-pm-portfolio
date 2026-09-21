# Demo 自洽验收清单（总账）

> 本文件是阶段 4 的**唯一"完成"判据**。任何"做完了"的说法必须回到本文件的对账表，逐格核对，不得以"页面能开""图好看"代替。
>
> 本文件**只登记事实与判据**，不修改任何阶段 2/3/4 冻结文档。上游口径冲突一律走 `08-interface-expansion-plan.md` §2.5 的登记流程。

## 0. 项目属性与诚实红线

| 项 | 值 |
|---|---|
| 项目属性 | **个人作品** |
| 数据性质 | 业务情境、案件、对象、指标、数字**全部为虚构 / 模拟**，不代表真实生产系统或上线效果 |
| 固定可见标识 | 每个页面 `global` 头部必须含「**个人作品 · 虚构模拟数据**」 |
| 禁止表述 | 不暗示真实公司经历、真实上线、真实指标；不得简称"真实系统覆盖" |

来源：`stage-4-prototype/04-sample-notes.md:4`、`08-interface-expansion-plan.md:220-224`。

---

## 1. 界面总账（14 = 对话窗口 1 + 编号 13）

来源：`stage-2-requirements/01-interface-inventory.md:35-84`（冻结总账 v3.2）。

| # | 界面 | 档位 | 所属链 | 承载 AC | 原型文件 | 实施状态 |
|---|---|---|---|---|---|---|
| — | 对话窗口 | A | 主界面 | AC-05、AC-06（P）；AC-14（S）；AC-15（E） | `prototype/samples/sample-dialog.html` | ✅ 已入库 |
| 1 | 策略引擎配置 | A | 在线 | AC-01 P、AC-02 P、AC-14 S、AC-15 E | `prototype/pages/strategy-engine.html` | ✅ `ac-01-strategy-version-detail`、`ac-02-routing-boundary` |
| 2 | 名单管理 | B | 在线 | AC-02 S | `prototype/pages/lists.html` | ✅ 批次 1 |
| 3 | 特征发布 | B | 在线 | — | `prototype/pages/features.html` | ✅ 批次 1 |
| 4 | 模型服务 | A | 在线（发布终点） | AC-09 S、AC-13 P、AC-15 E、AC-16 S | `prototype/pages/model-service.html` | ✅ `ac-09-model-tool-before-after`、`ac-13-model-register-before-after` |
| 5 | 实时监控 | A | 在线 | AC-02 S、AC-03 P、AC-04 P、AC-09 S、AC-12 P、AC-13 S、AC-14 S、AC-15 E、AC-16 P | `prototype/pages/realtime-monitor.html` | ✅ AC-03/04/12/16 对应 case |
| 6 | 实验管理 | A | 离线 | AC-07 P、AC-13 S、AC-15 E | `prototype/pages/experiment-management.html` | ✅ AC-07 正常/不足/失败 3 case |
| 7 | Agent 配置 | A | 离线 | AC-05 S、AC-08 P、AC-09 S、AC-14 S、AC-15 E | `prototype/pages/agent-config.html` | ✅ 批次 1 |
| 8 | 工具台 | A | 离线 | AC-05 S、AC-09 P、AC-11 S、AC-15 E、AC-16 S | `prototype/pages/toolbench.html` | ✅ 批次 1 |
| 9 | 任务队列 | A | 离线 | AC-05 S、AC-06 S、AC-07 S、AC-10 P、AC-15 E | `prototype/pages/task-queue.html` | ✅ `ac-10-task-five-states`、`ac-10-task-failure-retry` |
| 10 | 证据链视图 | A | 离线（共享组件） | AC-04 S、AC-09 S、AC-11 P、AC-12 S、AC-14 S、AC-15 E、AC-16 S | `prototype/pages/evidence-chain.html` | ✅ AC-11 直达/缺失/回溯 2 case |
| 11 | 验证报告 | A | 离线 | AC-07 S、AC-13 P、AC-15 E | `prototype/pages/validation-report.html` | ✅ AC-13 通过/未过 2 case |
| 12 | 数据集管理 | B | 离线 | AC-04 S、AC-07 S | `prototype/pages/datasets.html` | ✅ 批次 1 |
| 13 | 日志回放 | A | 排查 | AC-03 S、AC-14 P、AC-15 E、AC-16 S | `prototype/pages/log-replay.html` | ✅ AC-14 正常/缺失/超期 3 case |

**分档合计**：A = 11（编号 10 + 对话窗口 1）；B = 3；C = 0。

**批次进度**：批次 1 五页、批次 2 四页、批次 3 三页、批次 4 一页均有独立 HTML；新增 8 页的主动作、异常态、URL、键盘与跨页断言登记在 `prototype/tests/stage4-cases.json`。

来源：`08-interface-expansion-plan.md:163-176`（分批明细）、`:199-216`（覆盖矩阵）。

---

## 2. AC 覆盖对账（16 条）

来源：`stage-2-requirements/04-acceptance-criteria.md:18-190`。

| AC | 标题 | 链 | 主要承载页 | 原型可承载 | 实施状态 |
|---|---|---|---|---|---|
| AC-01 | 策略规则可查、可切换版本 | 在线 | 策略引擎配置 | ✅ 页面交互 | ✅ `ac-01-strategy-version-detail` |
| AC-02 | 分流边界与临时管控可见 | 在线 | 策略引擎配置 | ✅ 页面交互 | ✅ `ac-02-routing-boundary` |
| AC-03 | 实时监控可看可下钻 | 在线 | 实时监控 | ⚠️ 仅 fixture（虚构模拟） | ✅ `ac-03-monitor-seven-metrics-drill` |
| AC-04 | 抽检可推翻裁决并落负样本 | 在线 | 实时监控 | ⚠️ 仅 fixture（虚构模拟） | ✅ `ac-04-overturn-to-negative-sample` + B 页负样本 case |
| AC-05 | 对话可受理需求并给出执行计划 | 主界面 | 对话窗口 | ✅ 已可演示 | ✅ |
| AC-06 | 执行过程可打断、可追加参数 | 主界面 | 对话窗口 | ✅ 已可演示 | ✅ |
| AC-07 | 实验能跑出对比结果 | 离线 | 实验管理 | ✅ 页面交互 | ✅ 正常/覆盖不足/失败 3 case |
| AC-08 | Agent 配置可改可存版本 | 离线 | Agent 配置 | ✅ 页面交互 | ✅ 批次 1 |
| AC-09 | 工具可注册、可授权、可查调用记录 | 离线+在线 | 工具台 / 模型服务 | ⚠️ 仅 fixture（虚构模拟） | ✅ 工具台 3 case + 模型服务前后态 + 账本链 |
| AC-10 | 离线任务可批量执行、可重试 | 离线 | 任务队列 | ✅ 页面交互 | ✅ 五态 + 失败重试 2 case |
| AC-11 | 证据链视图可独立使用 | 离线 | 证据链视图 | ✅ 页面交互 | ✅ 直达/缺失/回溯 2 case |
| AC-12 | 待人工介入队列可处置 | 在线 | 实时监控 | ✅ 页面交互 | ✅ `ac-12-manual-queue-resolution` |
| AC-13 | 验证报告可生成待注册包，并经人在线侧注册生效 | 离线→在线 | 验证报告 / 模型服务 | ⚠️ 仅 fixture（虚构模拟） | ✅ 报告 2 case + 模型注册前后态 + 账本链 |
| AC-14 | 日志可回放、可定位异常 | 排查 | 日志回放 | ⚠️ 仅 fixture（虚构模拟） | ✅ 正常/缺失/超期 3 case |
| AC-15 | 三条线能接上（整体验收） | 端到端 | 多页 | ⚠️ 仅 fixture（虚构模拟） | ✅ 三条 `ac-15-*-ledger-chain` |
| AC-16 | 在线 Agent 可完成调查并正确收敛案件状态 | 在线（主线） | 实时监控 | ⚠️ 仅 fixture（虚构模拟） | ✅ 成功/失败 2 case |

**口径**（`08:220-224`）：补齐 13 页后，AC-01～02、AC-05～08、AC-10～12 可由页面交互直接演示；AC-03～04、AC-09、AC-13～16 **只能以明确标注"虚构模拟"的确定性 fixture 演示前态、动作和后态**。两类合计形成 **16/16 的原型演示覆盖**，但后者**不得简称为真实系统覆盖**。

---

## 3. 明确不验收的（继承阶段 2）

来源：`stage-2-requirements/04-acceptance-criteria.md:192-200`。

| 不验收 | 原因 |
|---|---|
| 准确率 / 召回率达标 | 模拟数据 |
| 性能 / 并发能力 | 原型不承载性能验证 |
| 权限体系完整性 | 不做 |
| 数据一致性（真实场景） | 模拟数据 |
| 界面视觉规范 | 原型阶段不考虑 |

**不验收 ≠ 可以不做。** 这些是"不必证明"，不是"不必存在"：门禁、AC 对账仍必须逐条给出证据。

---

## 4. 三条跨页因果账本链（AC-09 / AC-13 / AC-15）

来源：`08-interface-expansion-plan.md:187-195`。

| 链 | 字段 | 前态 | 推进动作 | 后态 |
|---|---|---|---|---|
| 工具授权 / AC-09 | `scenarioId, toolId, agentVersionId, authPackageId, caseId, stage` | `pendingApproval`：工具台显示待审批；指定 Agent 与未授权 Agent 的调用入口均禁用；调用记录为 0 | 模型服务按 `authPackageId` 人工批准，URL 进入 `stage=approved` | `approved`：仅指定 Agent 可调用；一次确定性调用后 `stage=called`，工具台与证据链按 `caseId` 显示同一调用记录；其他 Agent 仍禁用 |
| Agent 注册 / AC-13 | `scenarioId, reportId, registrationPackageId, agentVersionId, stage` | `reportPassed/packageGenerated`：验证报告四门禁一致；模型服务尚无已生效版本；实时监控不显示该版本 | 模型服务按包编号人工确认，URL 进入 `stage=registered` | `registered`：模型服务出现该版本；`monitored`：实时监控只显示账本定义的指标变化；**门禁未过 fixture 不生成包也不能直达 `registered`** |
| 三线衔接 / AC-15 | 上述字段 + `strategyVersionId, monitorCaseId, replayWindowId` | 三个衔接点分别停在未授权、未注册、未回放前态 | 沿授权批准→案件调用、报告注册→监控可见、监控时段→日志回放的固定链接推进 | 每个目标页显示相同对象 ID、版本、状态和数值；**工作台动作不产生在线写入记录，批准/注册明确标为模型服务页人工动作** |

**门禁含义**：三条链各有 `before` / `after` 两态；`09-fixtures-contract.md` 已冻结其快照机制（`getSnapshot(scenarioId, stage)` / `makeQuery(...)`）。**任一态缺失 = 该链未完成。**

---

## 5. 单页完成判据

来源：`08-interface-expansion-plan.md:181-183`。

一页算"完成"，必须同时满足：

| # | 判据 | 核对方式 |
|---|---|---|
| 1 | 独立 HTML，复用共享壳结构 | 与 `sample-dialog.html` 壳结构一致（导航 / 诚实标识 / `.main` / `.objects` 右栏 / `.toast`） |
| 2 | 引用共享 CSS/JS，相对路径 + 经典 `<script defer>` | `grep` 确认 |
| 3 | 只读消费 `window.RISK_FIXTURES`，不改冻结对象 | 哈希比对 |
| 4 | 状态经本页 reducer 迁移，非直接改 DOM | 用例断言 |
| 5 | **本页验收断言逐条通过**（见 §1 承载 AC / §2.3 原文） | 按 case ID 输出 |
| 6 | 1 张正式主状态图入库（浅色 `1200×960`、≤1MB、**无页面纵向溢出**） | 图 + 尺寸核对 |
| 7 | 深色主态截图入 `/tmp`，实测新增前景/背景对比度 | `/tmp` 证据 |
| 8 | 离线自检：`http=0 https=0 fetch=0 import=0` | 计数 |
| 9 | 运行时：`consoleErrors=0 externalRequests=0 failedRequests=0` | 计数 |
| 10 | 未触碰任何禁止文件 | 哈希比对 |
| 11 | 支持 `?theme=dark\|light` 与 `?state=`，无可见主题切换控件 | DOM 核对 |

**A 档额外**：主动作、异常态、键盘焦点、URL 直达四项均需断言。
**B 档额外**：做到 CRUD/单动作；**不扩展多步引导流**（负责人裁决，`08:226-234`）。

---

## 6. 批级门禁

来源：`08-interface-expansion-plan.md:181-185`、`:250-254`。

| 层级 | 要求 |
|---|---|
| 批内串行 | 批次 1：冻结 fixture 字段 → B 档三页 + Agent 配置 → Agent 版本断言通过 → 工具台。批次 2：实验管理 → 任务队列/证据链 → 验证报告。批次 3：策略引擎、模型服务前/后态断言 → 实时监控。批次 4：日志回放 |
| 批间回归 | 每合入一页先跑 **P0 manifest 全清单**（当前 77 项）与**固定环境像素门禁**，再跑该批已有页的 shell/token/导航快照 |
| 共享 CSS 变更 | **必须注明影响页清单** |
| 每批局部 | 每页正式主状态图固定浅色 `1200×960`、≤1MB、无纵向溢出；深色入 `/tmp` |
| 每批结束 | 做一次「**界面清单 × FR/AC × 可见状态 × 跨页对象**」对账；任何新页面、FR、AC 或对象类型**必须停止并回到负责人审批** |

**固定环境口径**（`08:102-110`）：浏览器 `chrome-headless-shell` 152.0.7977.75；`1200×960`、DPR=1、`--no-sandbox --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,960`；Pillow RGBA 逐像素比较，`different_pixels=0`；右栏特写按 `sips` 裁剪重采样派生。

---

## 7. 完成判据（终止条件）

整个阶段 4 算"完成"，必须**同时**满足：

| # | 判据 | 当前 |
|---|---|---|
| 1 | 14 个界面全部可开（对话窗口 + 13 编号） | ✅ 14/14；源码清单见 §10.1 |
| 2 | 16 条 AC 全部有承载页与逐条断言证据 | ✅ 16/16；P0 77 case、批次 1 A/B 12 case、新增页 26 case |
| 3 | 三条跨页账本链各有 `before`/`after` 合法快照并可推进 | ✅ `ac-15-tool-ledger-chain`、`ac-15-agent-ledger-chain`、`ac-15-three-line-ledger-chain` |
| 4 | P0 门禁保持 77/77 不回退 | ✅ `P0_GATE total=77 pass=77 fail=0 consoleErrors=0 externalRequests=0 failedRequests=0` |
| 5 | 13 页各有 1 张正式主状态图入库 | ✅ `prototype/screenshots/` 13/13；均 1200×960、≤1MB、内容区无纵向溢出 |
| 6 | `gate/` 本清单逐格有证据，无空格 | ✅ §1、§2、§7 与 §10 已填实施证据 |
| 7 | 三方独立评审对整批达成一致（写者不自评） | ⚠️ 有条件放行（有效 2/3）：Claude 判 `PASS`；Codex 判 `DEGRADED`（三条静态修复均核过，因未复跑 P0 而保守标降级）；DSH 本轮 timeout 未产出。写者未自评。负责人独立复跑补证：`P0_GATE total=77 pass=77 fail=0 consoleErrors=0 externalRequests=0 failedRequests=0`。三方未齐，记为有条件放行，待补 DSH |
| 8 | README 状态表与 `docs/` 交付物清单与实际一致 | ✅ README 登记 14 页、13 图与阶段 4 四类交付物 |
| 9 | 离线可用：断网时每页外部请求与失败请求均为 0 | ✅ 14/14：运行时 `externalRequests=0 failedRequests=0`；静态禁用项计数 0 |
| 10 | 诚实红线：每页固定可见「个人作品 · 虚构模拟数据」 | ✅ 14/14 DOM 可见；13 图截图日志逐页返回同一文案 |

**只要任一条不满足，阶段 4 就是"未完成"。** 这条是本项目"持续推进"的**唯一终止线**。

### 7.1 第 7 条放行留痕（2026-09-21）

**评审对象**：三条修复落盘后的版本（非旧版）。三条修复为：① 批次 1 五页导航由 6 链接 + 4 按钮改为 14 真链接；② `stage-4-prototype/10-information-architecture.md:30` AC-09 called 入口由 `evidence-chain.html` 改为 `toolbench.html`；③ `gate/00-acceptance-ledger.md:157` 大小上限由 `≤129817B` 改为 `≤1MB`。

**调度方式**：`honnold-acpx-wave.mjs` 一次波次，三家只读、禁改文件、禁出图、互不交换答案；写者（Codex）未参与自评。

**三方首行原文**：

| 评审方 | 首行 | 备注 |
|---|---|---|
| Claude | `VERDICT: PASS` | 结论完整；收尾阶段报 `PERMISSION_DENIED`，不影响已产出结论 |
| Codex | `VERDICT: DEGRADED` | 三条静态修复均核过；因读到 P0 脚本会 `mkdtempSync` 写盘、与只读约束冲突而未复跑，故不宣称无回退 |
| DSH | 无 | 进程 785s 用尽，`output` 为空，未产出结论 |

**两家有效评审的核实一致性**：五页导航 14/14（含目标文件存在性）、残留 `<button>` 每页 2 个且位于 `<nav>` 外为抽屉开关、AC-09 入口、账本 `≤1MB`、第 200 行 `129817` 字节为实测最大值非口径冲突、README DR-004 与实际相符——两家结论一致。

**负责人补证**：两家均因只读约束未复跑 P0，该缺口由负责人以锁定环境独立复跑补齐：

```
P0_GATE total=77 pass=77 fail=0 consoleErrors=0 externalRequests=0 failedRequests=0
```

浏览器为 `chrome-headless-shell` `152.0.7977.75`（167333040 字节），未更换版本。

**未决项**：

1. DSH 未产出，三方未齐 —— 本行记"有条件放行"，补齐 DSH 后方可转为无保留。
2. 仓库尚无 git 提交基线，两家均指出无法以 diff 完整排除夹带；此为独立于三条修复的事项。

---

## 8. 明确不做清单（not-do）

来源：`stage-2-requirements/01-interface-inventory.md:202-217`、`08-interface-expansion-plan.md:220-224`、各批任务书硬约束汇总。

| # | 不做 | 依据 |
|---|---|---|
| 1 | 不暗示真实公司 / 上线经历 / 真实指标 | 诚实红线 |
| 2 | 不引入 ES module / `fetch()` / 运行时读 JSON / CDN / 外部字体 | 离线约束 |
| 3 | 不改设计基线 §3 色彩 token（`--accent #4C9AFF`、`--warning #9A5409`、`--danger #B93645`、`--success #126F4D`） | `03-design-baseline.md` |
| 4 | 不改门禁判定口径（浏览器版本、DPR、flags、像素比较方式） | 自证循环防线 |
| 5 | 不新建批次外的页面 / FR / AC / 对象类型 | `08:254` |
| 6 | 不把 B 档升级为 A 档、不扩展多步引导流 | 负责人裁决 |
| 7 | 不出图入库（除每页 1 张正式主状态图） | `08:182` |
| 8 | 不重命名 / 泛化 / 清理既有冻结内容 | 抽取门禁 |
| 9 | 不做真实系统的权限强制、真实在线写入、真实注册生效 | 阶段 2 不验收清单 |
| 10 | 不在无人裁决的情况下自行改验收标准或冻结契约 | 独立性防线 |

---

## 9. 变更记录

| 编号 | 日期 | 变更 | 理由 |
|---|---|---|---|
| GL-001 | 2026-09-20 | 新建本文件；登记 14 界面总账、16 AC 对账、3 账本链、单页/批级门禁、10 条完成判据、10 条 not-do | 阶段 4 缺"完成"判据总账；`gate/` 自 2026-09-11 建立后一直为空 |
| GL-002 | 2026-09-20 | §1 的 8 个待建页面改为实际 HTML 与 case ID；§2 的 AC-01～04、07、09～16 改为逐条证据；§7 改为实测当前值；新增 §10 证据索引 | 目标模式实施证据落账；三方复评仍由负责人调度 |

## 10. 实施证据索引

### 10.1 页面与截图

- 对话页：`prototype/samples/sample-dialog.html`。
- 编号 13 页：`prototype/pages/` 下 `strategy-engine.html`、`lists.html`、`features.html`、`model-service.html`、`realtime-monitor.html`、`experiment-management.html`、`agent-config.html`、`toolbench.html`、`task-queue.html`、`evidence-chain.html`、`validation-report.html`、`datasets.html`、`log-replay.html`。
- 正式图：`prototype/screenshots/*.png` 共 13 张；逐张 1200×960，最大 129817 字节。

### 10.2 断言正本

- 对话页：`prototype/tests/p0-dialog-cases.json`，77 条。
- 批次 1 A 页：`prototype/tests/batch1-a-cases.json`，8 条。
- 批次 1 B 页：`prototype/tests/batch1-b-cases.json`，4 条。
- 批次 2–4：`prototype/tests/stage4-cases.json`，26 条；对应脚本 `stage4-regression.mjs`。

### 10.3 视觉与离线

- 固定浏览器：Chrome for Testing 152.0.7977.75；1200×960；DPR=1；固定 flags 与 §6 一致。
- 13 页深色图位于 `/tmp/stage4-dark/`；`--text-1/2/3` 对 `--surface-1` 的对比度分别为 17.013、8.572、5.834。
- 13 页运行时均为 `consoleErrors=0 externalRequests=0 failedRequests=0`；对话页 P0 同为 0。
- 对话页获授权导航变更相对旧金样的六张整页差异分别为 8415 / 8465 / 8415 / 8465 / 8465 / 8465 像素，差异边界均为 `x=23..126, y=163..726`（仅左侧导航）；派生右栏特写 `different_pixels=0`。旧金样未覆盖，待最终评审按 `08` §2.1“导航与 P0 金样裁决”决定是否重设。
