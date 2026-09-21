# 阶段 4 续做方案：共享资源抽取与其余界面补齐

> 文档性质：实施前方案；不修改原型、阶段 2/3 冻结文档或设计基线。  
> 结论：先做一次“只搬不改”的 P0 资源抽取并以像素零差异为门禁，再以 13 个独立 HTML、共享本地 CSS/JS、统一 fixture 对象补齐其余界面。业务事实仍以阶段 2/3 冻结文档为准；共享组件的视觉与交互以现有对话窗口为准。

## 1. 事实核对

### 1.1 冻结界面总账：14 个

总账头部明确写为“对话窗口 1 + 编号界面 13；A 档 11、B 档 3、C 档 0”，并在分档段再次列出 11 个 A 档界面。[来源：`stage-2-requirements/01-interface-inventory.md:3-5,68-80`]

| # | 名称 | 干什么 | 档位 | 冻结依据 |
|---:|---|---|:---:|---|
| — | 对话窗口 | 工作台主界面；自然语言下达风控运营需求并调度能力完成 | A | `stage-2-requirements/01-interface-inventory.md:35-41` |
| 1 | 策略引擎配置 | 规则 / 阈值 / 名单挂载，版本化管理 | A | `stage-2-requirements/01-interface-inventory.md:43-51` |
| 2 | 名单管理 | 黑白名单增删改查与生效范围 | B | 同上 |
| 3 | 特征发布 | 特征定义、上线、版本切换 | B | 同上 |
| 4 | 模型服务 | 模型注册、版本、上下线；接收待注册包/工具授权包并由人确认 | A | 同上 |
| 5 | 实时监控 | 命中率、异常率、裁决分布、告警、抽检及待人工介入队列 | A | 同上 |
| 6 | 实验管理 | 新建实验、配对照组、跑评测、结果对比 | A | `stage-2-requirements/01-interface-inventory.md:55-66` |
| 7 | Agent 配置 | 提示词、可调用工具、权限、边界、版本 | A | 同上 |
| 8 | 工具台（MCP / Skill / CLI） | 工具注册、授权、调试、调用记录 | A | 同上 |
| 9 | 任务队列 | 离线调查任务排队、执行、失败重试 | A | 同上 |
| 10 | 证据链视图 | 单案取证过程回放与检查；共享组件 | A | 同上 |
| 11 | 验证报告 | 验证结论生成待注册对象 | A | 同上 |
| 12 | 数据集管理 | 评测集、样本标注、版本；承接抽检负样本 | B | 同上 |
| 13 | 日志回放 | 读取在线日志并回放实时链经过，用于异常排查 | A | 同上 |

机械扫描 `rg --files prototype` 当前只返回 `prototype/samples/sample-dialog.html`；因此待补是编号界面 13 个，不包含新的“待人工介入队列”或“分流处置”页面。

### 1.2 阶段 3 修正不改变 14 个总数

**结论：不改变。** 阶段 3 仍把全量定义为 14 个，并明确线框只是 17 个关键帧而非新增页面。[来源：`stage-3-features/00-stage3-README.md:24-34`]

- “待人工介入队列”归入实时监控内部队列视图，不是独立界面；任务队列仍是 FR-13 的离线任务队列，两者不能合并。[来源：`stage-3-features/00-stage3-README.md:31-34,36-46`]
- “分流处置”是线 3 节拍 6 的动作，不是独立界面。[来源：`stage-3-features/00-stage3-README.md:31-34,54-62`]
- 变更记录只修正“对应界面”栏混入子视图的问题，没有增加或删除总账行。[来源：`stage-3-features/00-stage3-README.md:93-94`]
- 总账变更记录中 `S2-DR-015` 记载过历史口径 A=10/B=4，后续 `S2-DR-025` 已把模型服务升为 A 并收敛为 A=11/B=3；冻结结论以 v3.2 头部、§2.4 与 `S2-DR-030` 为准，历史行不应被抹掉。[来源：`stage-2-requirements/01-interface-inventory.md:4,68-80,238,242-243`]

### 1.3 对话窗口的源码入口与实测结果

2026-09-20 使用 `chrome-headless-shell --dump-dom` 逐个打开本地 `file://` URL；DOM 根节点由 `render()` 写入 5 个可观察 `data-*`：`data-theme`，以及 4 个只读状态代理 `data-session-phase / data-run-state / data-workspace-mode / data-degraded`。源码声明两个主题、10 个 URL fixture、10 个 `runState` 和两个工作区模式。[来源：`prototype/samples/sample-dialog.html:130-149,181-220,400-410`]

| 入口 | 实际支持值 / 可见结果 | 源码与 DOM 证据 |
|---|---|---|
| `?theme=` | `dark`、`light`；DOM 分别为 `data-theme="dark|light"` | `prototype/samples/sample-dialog.html:9-24,135,209-215` |
| `?state=` | `empty`→`new/idle/空闲`；`loading`→`active/accepting/核对中`；`confirm`→`awaitingConfirm/等待确认`；`normal`→`running/执行中`；`paused`→`paused/已暂停`；`completed`→`succeeded/已完成`；`error`→`failed/执行失败`；`timeout`→`timedOut/已超时`；`unauthorized`→`blocked/已阻止`；`degraded`→`running + degraded=true/降级运行` | `prototype/samples/sample-dialog.html:132-136,181-207,327-338` |
| `outputViewer` | `?mode=output&output=plan-snapshot` 进入 `data-workspace-mode="outputViewer"`，标题为“验证方案.md”；另有 `R-4517` 与 `case-detail` fixture；未知 ID 显示安全缺省页 | `prototype/samples/sample-dialog.html:133,209-220,277-280,374-380` |
| 顶栏状态 | 底层 10 个 `runState`：空闲、核对中、等待确认、执行中、已暂停、已取消、已完成、执行失败、已超时、已阻止；`degraded` 不是第 11 个 runState，而是 `running` 上的 flag 展示“降级运行” | `prototype/samples/sample-dialog.html:132-134,327-338` |
| 右栏 | 四个任务内容区：当前状态、实时步骤、最新产出、对象；能力事实是右栏底部常驻行，不算第五个任务区块 | `prototype/samples/sample-dialog.html:297-318` |
| 自包含现状 | 1 个 `<style>`、1 个 `<script>`、11 个 `<svg>` 标签、10 个 `<symbol>` 定义，0 个 `http(s)`、0 个带 `src/href` 的外部 script/link | `prototype/samples/sample-dialog.html:8-85,128-510`；机械计数 |

## 2. 方案

### 2.1 文件与共享资源结构

#### 决策

采用 **13 个独立 HTML + 本地相对路径共享资源**，不采用单 HTML 的 `?page=` 路由。判别性理由是：每页可以拥有独立 DOM、页面 reducer 和验收入口，同时通过经典脚本共享资源；无需在 `file://` 环境引入路由启动层、ES module 或运行时 `fetch()`。`?theme=`、`?state=` 仍是页内展示参数，不承担页面路由。

建议目录如下（仅为实施目标，本文件不创建这些路径）：

```text
prototype/
├── assets/
│   ├── css/
│   │   ├── tokens.css          # 深浅主题 token；原值原顺序搬出
│   │   ├── base.css            # reset、字体、focus、按钮基础
│   │   ├── shell.css           # global/nav/main/E-I-F 栅格与 979/759 抽屉
│   │   ├── components.css      # badge、卡片、表格、表单、toast、viewer
│   │   └── dialog.css          # composer、消息、计划卡、对话执行侧栏
│   └── js/
│       ├── fixtures.js         # 固定时钟、对象 ID、跨页一致的模拟数据
│       ├── icons.js            # 内联 sprite 注入，不请求网络
│       ├── core.js             # theme/query、escapeHtml、dispatch 契约、只读代理
│       ├── shell.js            # 导航、抽屉 inert/焦点、toast、通用查看态
│       ├── components.js       # 通用渲染器；无页面业务状态
│       └── pages/*.js          # 每页 reducer、fixture 映射和 render
├── samples/sample-dialog.html  # 路径不变；DOM 不变；改为引用共享资源
└── pages/
    ├── strategy-engine.html
    ├── list-management.html
    ├── feature-release.html
    ├── model-service.html
    ├── realtime-monitor.html
    ├── experiment-management.html
    ├── agent-configuration.html
    ├── tool-console.html
    ├── task-queue.html
    ├── evidence-chain.html
    ├── validation-report.html
    ├── dataset-management.html
    └── log-replay.html
```

#### 离线与截图约束

- 所有 CSS/JS 使用相对路径；使用经典 `<script defer>`，不使用 ES module、`fetch()` 或运行时读取 JSON，避免 `file://` CORS。跨页 fixture 由 `fixtures.js` 挂只读全局对象；跨页跳转只传对象 ID / fixture ID。
- 双击任一 HTML 可开；断网时**外部网络请求与失败请求均为 0**，本地 CSS/JS 的 `file://` 读取不计为外部请求。共享资源改变“单文件自包含”，但不改变“离线可用”。这是负责人已批准的取舍。
- PNG 大小由 1200×960 渲染内容决定，不因 HTML 拆资源直接增大；每页主状态图仍以 ≤1MB 为门禁，图表不用外部字体或位图背景。[现有口径：`stage-4-prototype/03-design-baseline.md:129-154,234-243`]

#### P0 抽取门禁

1. 冻结现有 HTML、6 张完整页面截图和 1 张由运行态裁剪并重采样得到的右栏特写；不得把右栏特写记作第 7 张完整页面截图。[构成与复现：`stage-4-prototype/04-sample-notes.md:63-82`]
2. 先逐字搬出 CSS，保持加载顺序和选择器不变；再逐字搬出 JS，保持 DOM、事件名、状态模型、计时和 history 行为不变。**抽取提交不允许同时重命名、泛化或清理。**
3. 截图环境锁定为 `/Users/test/.cache/puppeteer/chrome-headless-shell/mac_arm-152.0.7977.75/chrome-headless-shell-mac-arm64/chrome-headless-shell`（`Google Chrome for Testing 152.0.7977.75`），`1200×960`、DPR=1，并固定 `--no-sandbox --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,960`；命令与 6 个 URL 取自 `stage-4-prototype/04-sample-notes.md:63-78`。页面须等到 `document.fonts.ready`、目标状态代理稳定且连续两帧布局坐标不变后截图。
4. 6 张完整页面图使用 Pillow 解码为 RGBA 后逐像素比较，判定条件为尺寸相同且 `different_pixels=0`；右栏特写按 `stage-4-prototype/04-sample-notes.md:79-81` 从新运行态图执行同一 `sips` 裁剪/重采样，再与现图逐像素比较。文件 SHA-256 只记录，不代替像素判定。
5. 仓库目前没有可复跑的 `17/17、11/11、10/10` 脚本或用例清单，因此本方案不再写“重跑”这些历史计数。资源抽取提交必须先固化 `prototype/tests/p0-dialog-cases.json`（逐条编号 `transition / url / input-focus / indicator / rail / history`）和 `/tmp` 之外的 `prototype/tests/p0-regression.mjs`；用例来源是 `stage-4-prototype/07-layout-revision-proposal.md:380-450` 的 §11.1–§11.5，其中正式桌面、临时图和防御性断点的证据边界服从 §11.3/§11.4。[来源：`stage-4-prototype/07-layout-revision-proposal.md:380-450`]
6. 调用方式固定为 `node prototype/tests/p0-regression.mjs --browser "$BROWSER" --manifest prototype/tests/p0-dialog-cases.json --page "file://$PWD/prototype/samples/sample-dialog.html"`；机器判定输出必须含 `P0_GATE total=<n> pass=<n> fail=0 consoleErrors=0 externalRequests=0 failedRequests=0`，并按 case ID 输出失败 URL、状态快照与断言。24 条 transition 和 10 个 URL fixture 逐条列入 manifest；输入/焦点、指示器、右栏不再引用无清单支撑的汇总数字。
7. 任一像素、DOM、键盘、history、控制台或网络门禁失败即停止，不进入页面扩展；门禁通过后才从原样资源复制出通用层。对话专有代码保留在 `dialog.css` 与 `pages/dialog.js`，不强迫其他页面复用对话状态机。

#### 导航与 P0 金样裁决

采用“**导航变更经评审后允许重拍并重设 P0 金样**”方案，不另造绕过对话页的隐蔽入口。资源抽取门禁先在导航不变时要求上述像素零差异；13 页文件名与导航信息架构冻结后，导航扩容作为独立变更，不与 CSS/JS 抽取或页面功能混合。

导航候选先输出到 `/tmp`，逐项核对：14 个总账入口均可达、当前页语义、键盘顺序、1200×960 无裁切、对话交互断言无回退。负责人评审导航差异后，才覆盖 6 张完整页面图，并按固定裁剪流程重生右栏特写；在 `04-sample-notes.md` 记录旧/新 7 个文件哈希、浏览器版本、命令和批准原因。自该记录起，新图成为后续共享资源变更的像素金样；旧金样不再被描述为“永不变化”。

#### 通用与专有边界

| 通用资源 | 对话窗口专有资源 |
|---|---|
| 深浅 token、字体层级、4px 间距、焦点环、按钮高度、语义色 | `sessionPhase/runState/workspaceMode/degraded` 三轴与 24 个 transition |
| 全局诚实标识、导航、页头、F/I/E 栅格、979/759 抽屉 | 消息流、composer、IME/Enter/Shift+Enter、计划确认/变更/取消 |
| icon sprite、badge/status dot、按钮、卡片、表格、表单、toast | 用户/助手消息、计划摘要、中断记录、旧参数标记 |
| 静态安全 viewer 壳、Escape/焦点归还、URL parser 基础 | 对话右栏的 `rightRailModel`、实时步骤及会话对象派生 |
| fixture ID、固定时钟、对象间引用与安全 HTML 转义 | 对话专用 `OUTPUT_FIXTURES`、标题从首条用户消息派生 |

### 2.2 与 P0 准则的冲突处理

#### 裁决规则

1. **业务职责与 AC：** 服从阶段 2/3 冻结定义，P0 对话窗口不能删掉其他页面独有的 FR/AC。
2. **同语义组件的视觉和交互：** 服从当前 P0 对话窗口，以及 `stage-4-prototype/07-layout-revision-proposal.md:346-364` §9 已登记的基线修订；现行设计基线 v0.3 仅在不与该登记冲突时适用。不得在页面 CSS 中覆盖全局 token、`.btn`、`.badge`、焦点、抽屉或 toast 的既有契约。[来源：`stage-4-prototype/03-design-baseline.md:55-102,146-188,198-207`；`stage-4-prototype/07-layout-revision-proposal.md:346-364`]
3. **新语义：** 仅在确实没有 P0 等价物时新增 modifier（如 `badge--approval`），先写语义和状态表，再加样式；新增后执行 P0 manifest 全清单和固定环境像素门禁。
4. **冗余信息：** 顶栏承载页面/任务全局状态，卡内 badge 只承载对象自身状态；同义状态不得重复。长任务进度只出现一个实时主视图。[来源：`stage-4-prototype/03-design-baseline.md:118-125,166-180`]

| 预判冲突组件 | 易发生的冲突 | 收敛方式 |
|---|---|---|
| 状态 indicator / badge | 看板、审批包、任务表各自发明颜色或重复全局状态 | 沿用 P0 的 neutral/info/warning/success/danger 与文字；对象 badge 不复制顶栏文案 |
| 按钮与确认动作 | 注册、授权、推翻、重试使用不同高度/危险色/焦点 | 普通 36px、核心 40–44px；危险动作使用现有 danger；二次确认走同一 focus/feedback 契约 |
| 第三栏 / 抽屉 | 每页固定三栏或把详情、进度、帮助混在一栏 | 沿用 E/I/F 动态模式：长任务用 E、对象详情用 I、其余 F；979px 以下同一 inert/Escape/焦点归还逻辑。[来源：`stage-4-prototype/07-layout-revision-proposal.md:310-344`]
| toast / 就地反馈 | 点击后只弹 toast，或同一动作同时改 DOM 与弹无关提示 | 状态先由 reducer 变更并就地呈现，toast 只补充短反馈；事件处理器不旁路修改 DOM |
| viewer / 详情页 | 各页使用不同 modal、允许原始 HTML或外部资源 | 统一静态安全 viewer、Escape、history、焦点归还；表格/代码只在主区查看态，不进窄栏 |
| 表格 / 对象行 | B 页做成大卡片墙，A 页又用密集表格 | 列表使用 36–40px 行和渐进下钻；对象紧凑行沿用 P0，重点详情进入 I 而非新增 featured 卡 |

#### 状态语义域与非任务页顶栏契约

| 语义域 | 状态来源 | 放置位置 | 可复用 P0 的部分 | 禁止混用 |
|---|---|---|---|---|
| 任务运行态 | 长任务 reducer：待确认、运行、暂停、成功、失败、超时、阻止、降级 | 顶栏全局 indicator；实时步骤 | P0 的 dot、浅色框、warning/success/danger/info/neutral token 与 ARIA | 不把审批“待批准”写成任务“等待确认” |
| 审批态 | 授权包/注册包：草稿、待审批、批准、拒绝、失效 | 审批卡、表格状态列、I 检查器 | badge 形状、token 与焦点规范 | 不进入 `runState`，不复制 P0 的暂停/超时文案 |
| 对象生命周期 | 配置/版本/数据集：草稿、已发布、已停用、归档 | 对象行、版本列表 | neutral/info/success 的视觉语法 | “已发布”不等于任务“已完成” |
| 风险裁决态 | 放行、拒绝、转人工、临时管控、待复核 | 案件详情和监控列表 | danger/warning/success token 与图标规范 | 不用颜色单独表达结论；不得映射为任务失败/阻止 |

13 个非对话页统一暴露 `data-page-state="loading|ready|empty|error"`；只有页面正在承载可暂停/可恢复的长任务时，才额外暴露 `data-task-state` 并在顶栏使用 P0 任务 indicator。默认 `ready` 不显示“执行中”；审批态、对象生命周期和风险裁决态只在对象上下文中显示。页头状态组件必须带 `data-status-domain="page|task"`，测试据此阻止各页自造同名状态或把对象状态抬升为全局状态。

### 2.3 13 个界面的分批、依赖与组件策略

依赖顺序为：**P0 抽取门禁 → 基础目录/配置 → 离线执行链 → 在线链 → 跨线回放**。原因是实验依赖 Agent/数据集/工具，报告依赖实验，模型服务消费报告和工具授权包，实时监控需要策略/模型 fixture，日志回放最后复用在线日志与证据结构。[功能路径依据：`stage-3-features/01-feature-list.md:94-112`]

进入批次 1 前先冻结 `fixtures.js` 的前向字段契约：名单/特征/数据集版本、Agent 版本、工具与授权包、实验、任务、证据、报告包、策略、模型注册、监控案件和日志回放的 ID、状态枚举及引用字段。此时只定义字段和确定性快照，不提前实现批次 2–4 的页面。

| 批次 | 界面 | 依赖 | 直接复用 | 需要新造 | 本页验收 |
|---|---|---|---|---|---|
| 1 | 名单管理（B） | 共享壳 | 表格、badge、I 抽屉、toast | 生效范围、单条增删改查 fixture | 1 张主状态图；新增/停用 1 条 DOM 断言 |
| 1 | 特征发布（B） | 共享壳 | 表格、版本 badge、I 抽屉 | 特征版本切换与发布记录 | 1 张图；切换版本状态断言 |
| 1 | 数据集管理（B） | 共享壳 | 表格、I 抽屉、对象行 | 数据集版本、标注摘要、负样本入口 | 1 张图；负样本可查断言 |
| 1 | Agent 配置 | 工具/数据 fixture 名称冻结 | 表单、badge、viewer、toast | prompt 编辑、工具权限矩阵、版本历史 | AC-08 保存新版本 + 旧版本可查；截图与键盘路径 |
| 1 | 工具台 | Agent 版本 fixture | 表单、表格、badge、viewer | schema 表单、授权包、调用记录 | AC-09 注册→待审批；按案件查记录；未授权禁用 |
| 2 | 实验管理 | Agent、工具、数据集 | E/I/F 壳、步骤、右栏、viewer | A/B 配置、门禁对比矩阵 | AC-07 正常/覆盖不足；运行、完成、失败状态断言 |
| 2 | 任务队列 | 实验产生任务 | 表格、实时步骤、badge、toast | 批任务状态机、失败重试 | AC-10 五态与单条失败→重试成功 |
| 2 | 证据链视图 | 工具调用/任务 fixture | P0 证据卡、viewer、I 检查器 | 步骤筛选、单步输入/结果/耗时 | AC-11 独立直达、缺失标识、回溯对象 |
| 2 | 验证报告 | 实验结果、证据链 | viewer、表格、badge、对象行 | 四项门禁 scorecard、待注册包 | AC-13 门禁过/不过；不过时按钮 disabled |
| 3 | 策略引擎配置 | 名单/特征 fixture | 表格、表单、badge、I 检查器 | 规则详情、阈值、版本切换、分流预览 | AC-01/02；版本反馈、默认转 Agent |
| 3 | 模型服务 | 工具授权包、待注册包 | 表格、审批卡、badge、toast | 按包编号调取、确认/拒绝、版本列表 | AC-09/13 两类包；确认前后状态与人工动作 |
| 3 | 实时监控 | 策略/模型/工具/证据 | badge、I/E、证据 viewer、抽屉 | KPI、下钻、案件详情、内部人工队列、调查轨迹 | AC-03/04/12/16；看板→案件→处置完整断言 |
| 4 | 日志回放 | 实时日志、证据、策略/Agent 配置 | 筛选、E/I、实时步骤、viewer | 时间窗回放、事件时间线、异常定位 | AC-14；日志缺失/超期；跳策略或 Agent 配置 |

#### 批级验收

- **批内串行：** 批次 1 先冻结 fixture 字段，再实现 B 档三页与 Agent 配置，Agent 版本断言通过后才做工具台；批次 2 为实验管理 → 任务队列/证据链 → 验证报告；批次 3 先分别完成策略引擎、模型服务的前态/后态断言，再进入实时监控；批次 4 最后接日志回放。箭头后的页面不得用未通过门禁的前页状态。
- **每批局部：** 每页正式主状态图固定为浅色 `1200×960`、≤1MB、无页面纵向溢出；同一主状态另以深色在 `/tmp` 截图并按 `07` §11.4 实测新增前景/背景对比度，不追加仓库正式图。A 页跑主动作、异常态、键盘焦点与 URL 直达；B 页按负责人裁决做到 CRUD/单动作，不扩展多步引导流。[档位依据：`stage-2-requirements/01-interface-inventory.md:68-74`；双主题依据：`stage-4-prototype/07-layout-revision-proposal.md:438-444`]
- **批间回归：** 每合入一页先执行 P0 manifest 全清单和固定环境像素门禁，再跑该批已有页的 shell/token/导航快照；共享 CSS 变化必须注明影响页清单。
- **跨页验收：** 使用稳定 fixture ID 串联“报告包→模型服务→监控”“工具授权包→模型服务→案件调用记录”“监控时段→日志回放”；断言 URL 中对象 ID、各页状态和数字一致，但不伪装成真实持久化。
- **截图证据：** 建议仓库只保留 13 张页面主状态图；异常/中间态使用 DOM 断言和 `/tmp` 临时图，避免截图数量失控。对话页的 6 张完整页面图与 1 张派生右栏特写按“导航与 P0 金样裁决”管理。

#### 跨页因果状态账本

跨页动作不依赖真实后端、`localStorage` 或页面私有副本。`fixtures.js` 提供不可变的 `scenarioId + stage` 快照；链接统一携带 `?scenario=<id>&stage=<stage>&object=<id>`，目标页只按三者解析同一账本。页面动作必须经本页 reducer 产生下一 `stage` 和下一页链接，直接改 DOM 或只改展示文案不算状态迁移。刷新、后退和直接链接必须得到同一快照。

| 因果链 / AC | 跨页继承字段 | 前态断言 | 动作与传递 | 后态断言 |
|---|---|---|---|---|
| 工具授权 / AC-09 | `scenarioId, toolId, agentVersionId, authPackageId, caseId, stage` | `pendingApproval`：工具台显示待审批；指定 Agent 与未授权 Agent 的调用入口均禁用；调用记录为 0 | 模型服务按 `authPackageId` 人工批准，URL 进入 `stage=approved`；跳转案件详情沿用同一账本 | `approved`：仅指定 Agent 可调用；一次确定性调用后 `stage=called`，工具台与证据链按 `caseId` 显示同一调用记录；其他 Agent 仍禁用 |
| Agent 注册 / AC-13 | `scenarioId, reportId, registrationPackageId, agentVersionId, stage` | `reportPassed/packageGenerated`：验证报告四门禁一致；模型服务尚无已生效版本；实时监控不显示该版本 | 模型服务按包编号人工确认，URL 进入 `stage=registered`；监控链接推进为 `stage=monitored` | `registered`：模型服务出现该版本；`monitored`：实时监控只显示账本定义的指标变化；门禁未过 fixture 不生成包也不能直达 registered |
| 三线衔接 / AC-15 | 上述字段 + `strategyVersionId, monitorCaseId, replayWindowId` | 三个衔接点分别停在未授权、未注册、未回放前态 | 沿授权批准→案件调用、报告注册→监控可见、监控时段→日志回放的固定链接推进 | 每个目标页显示相同对象 ID、版本、状态和数值；工作台动作不产生在线写入记录，批准/注册明确标为模型服务页人工动作 |

每条账本链都必须保存至少一组 `before` 与 `after` 合法快照，并以 `scenarioId + stage` 参数化测试：直接打开前态 URL、执行动作、读取生成链接、打开后态页、后退、刷新，再核对 DOM 代理、禁用态、对象 ID、记录数和可见数值。这样只证明确定性跨页因果演示，不把 fixture 记作真实授权、注册或线上监控证据。[验收依据：`stage-2-requirements/04-acceptance-criteria.md:112-120,142-149,180-187`]

### 2.4 14 个界面 × 16 条 AC 覆盖矩阵

图例：`P`=主要验收界面；`S`=提供前置、跳转或一致性证据；`E`=AC-15 的端到端参与页；`—`=无直接覆盖。映射以 FR→界面→AC 冻结表为主，并补入 AC 文本明确要求的跨页证据。[来源：`stage-3-features/01-feature-list.md:65-88,94-112`；`stage-2-requirements/04-acceptance-criteria.md:16-188`]

| 界面 | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | 11 | 12 | 13 | 14 | 15 | 16 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 对话窗口 | — | — | — | — | P | P | — | — | — | — | — | — | — | S | E | — |
| 策略引擎配置 | P | P | — | — | — | — | — | — | — | — | — | — | — | S | E | — |
| 名单管理（B） | — | S | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| 特征发布（B） | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| 模型服务 | — | — | — | — | — | — | — | — | S | — | — | — | P | — | E | S |
| 实时监控 | — | S | P | P | — | — | — | — | S | — | — | P | S | S | E | P |
| 实验管理 | — | — | — | — | — | — | P | — | — | — | — | — | S | — | E | — |
| Agent 配置 | — | — | — | — | S | — | — | P | S | — | — | — | — | S | E | — |
| 工具台 | — | — | — | — | S | — | — | — | P | — | S | — | — | — | E | S |
| 任务队列 | — | — | — | — | S | S | S | — | — | P | — | — | — | — | E | — |
| 证据链视图 | — | — | — | S | — | — | — | — | S | — | P | S | — | S | E | S |
| 验证报告 | — | — | — | — | — | — | S | — | — | — | — | — | P | — | E | — |
| 数据集管理（B） | — | — | — | S | — | — | S | — | — | — | — | — | — | — | — | — |
| 日志回放 | — | — | S | — | — | — | — | — | — | — | — | — | — | P | E | S |

#### 可演示边界

- **当前对话页可直接演示：** AC-05、AC-06；AC-11/14/15/16 只能看到局部入口或 fixture，缺独立承载页和跨页闭环。
- **补齐 13 页后：** AC-01～02、AC-05～08、AC-10～12 可由页面交互直接演示；AC-03～04、AC-09、AC-13～16 只能以明确标注“虚构模拟”的确定性 fixture 演示前态、动作和后态。两类合计形成 16/16 的原型演示覆盖，但后者不得简称为真实系统覆盖。
- **即使页面补齐，仍不能作为真实系统证据：** AC-03（指标与真实日志一致）、AC-04（真实解除管控与持久落负样本）、AC-09（真实授权强制与后续调用）、AC-13（真实在线注册与指标变化）、AC-14（与历史日志逐步一致）、AC-15（真实跨系统衔接）、AC-16（真实 Agent 调用、裁决回填和管控收敛）。冻结文档也明确不验收真实数据一致性、性能和完整权限体系。[来源：`stage-2-requirements/04-acceptance-criteria.md:38-55,112-120,142-188,192-200`；`stage-2-requirements/01-interface-inventory.md:5,123-125`]

### 2.5 B 档范围冲突登记

本节只登记已发生的文档口径冲突和负责人裁决，不修改阶段 2/3 冻结文档。格式沿用 `stage-4-prototype/07-layout-revision-proposal.md:346-364` §9。

| 冲突位置 | 原口径 | 裁决口径 | 裁决与依据 |
|---|---|---|---|
| `stage-2-requirements/01-interface-inventory.md:70-74` | B 档“有界面、有数据、能展示，支持增删改查或单个动作，不做多步引导流” | 名单管理、特征发布、数据集管理均做到 CRUD/单动作档位；不扩展多步引导流，不升级为 A 档 | 负责人已拍板；阶段 2 冻结总账 v3.2 是界面范围裁决依据 |
| `stage-3-features/01-feature-list.md:28,42-43,59` | B 档“只做展示”“不列功能” | 解释为阶段 3 线框与功能清单的裁剪，不解释为取消阶段 2 已冻结的 CRUD/单动作范围 | 负责人已拍板；阶段 3 原文所处章节是“按界面归集的功能清单”，不能覆盖阶段 2 的档位判定 |
| `stage-4-prototype/07-layout-revision-proposal.md:344,468` | 07 写明 B 档“只登记布局归属，不扩展为可点击高保真页面”“不把 B 档页面扩展成可点击高保真页面” | 负责人裁决名单管理、特征发布、数据集管理做到 CRUD/单动作档位，取代 07 的“不可点击”约束 | 负责人已拍板；07 相应条款待阶段 4 后续轮次按 07 §9 登记流程同步修订 |

### 2.6 主要风险与缓解

| 风险 | 后果 | 缓解 |
|---|---|---|
| 抽取共享资源时顺手重构 | P0 DOM、级联或时序漂移，金样失效 | “只搬不改”单独提交；6 张整页像素差 0、右栏特写按固定裁剪复生且像素差 0、清单断言通过后才泛化 |
| `file://` 下模块/fetch 失效 | 双击白屏或 fixture 加载失败 | 经典 defer script、相对路径、无 fetch/import；断网逐页启动测试 |
| 通用 CSS 污染页面 | 某页局部覆盖反向破坏对话页 | 通用类只提供单一语义；页面类命名空间；每次共享改动执行 P0 manifest 和像素门禁 |
| 13 页复制同一状态逻辑 | 状态/颜色/ARIA 再次分叉 | 共享 shell 和通用 reducer 契约；页面只定义自己的状态表和 render |
| E/I/F 被做成静态三栏 | 空页面仍有无意义右栏，或长任务缺实时进度 | 按触发/退出条件切模式，不按页面永久贴标签。[来源：`stage-4-prototype/07-layout-revision-proposal.md:310-344`] |
| B 档工作量失控 | 名单/特征/数据集挤占主线工期 | 按负责人裁决做到 CRUD/单动作；不做多步向导，不升级 A 档 |
| 跨页 fixture 数字/对象不一致 | AC-15 看似串联但证据对不上 | 单一 `fixtures.js`、稳定 ID、矩阵化跨页快照；禁止页面私有复制同一对象 |
| 为“演示完整”伪装真实能力 | 把静态 fixture 说成真实调用/上线 | 全局诚实标识固定；系统级不可验证项单列，不用“生产验证”等文案。[来源：`stage-4-prototype/03-design-baseline.md:8-14,209-217`] |
| 截图证据膨胀 | 仓库体积与复核成本失控 | 每页 1 张正式主状态图；中间态只留自动化结果和 `/tmp` 图 |

## 3. 建议实施门禁

1. 多方评审先只批准：目录方案、13 个独立 HTML、P0 零差异门禁、分批顺序、AC 矩阵。
2. 实施首批只做资源抽取，不新建页面；P0 门禁通过后再进入批次 1。
3. 每批结束做一次“界面清单 × FR/AC × 可见状态 × 跨页对象”对账；任何新页面、FR、AC 或对象类型都必须停止并回到负责人审批。

## 4. 需要负责人拍板的开放点

仅有一个非阻塞选择：**正式截图是否按“13 页各 1 张主状态图”入库。** 本方案推荐入库 13 张主状态图，异常/中间态只用 DOM 断言与 `/tmp` 临时图；若负责人希望控制仓库体积，可改为每批 1 张总览 + 每个 A 页 1 张，B 页只保留 DOM 证据。该选择不改变页面结构和 AC 覆盖。

## 5. 变更记录

| 位置 | 改前 | 改后 |
|---|---|---|
| §1.3，原第 42 行 | “DOM 根节点的四个代理属性” | 记为 5 个可观察属性：`data-theme` + 4 个只读状态代理 |
| §2.1“决策”，原第 59 行 | 以双击、截图定位和“巨型 reducer”解释独立 HTML | 改为独立 DOM/页面 reducer/验收入口，并避免 `file://` 下的路由启动层、ES module 与运行时 `fetch()` |
| §2.1“离线与截图约束”，原第 99 行 | “断网时 network request 必须为 0” | 改为外部网络请求与失败请求为 0，本地 CSS/JS 加载不计入外部请求 |
| §2.1“P0 抽取门禁”，原第 104–106 行 | “七张正式图”“七张相同 URL”“重跑 17/17、11/11、10/10” | 改为 6 张完整页面图 + 1 张派生特写；登记固定浏览器、DPR、flags、等待条件、RGBA 像素比较及派生图复现 |
| §2.1“P0 抽取门禁”，原第 106 行 | 无可复跑脚本路径和机器输出契约 | 规定先固化 `prototype/tests/p0-dialog-cases.json` 与 `prototype/tests/p0-regression.mjs`，引用 `07` §11.1–§11.5，并定义调用方式和 `P0_GATE` 输出 |
| §2.1“导航与 P0 金样裁决”，新增 | 对话页像素零差异与新增导航相互冲突 | 资源抽取先零差异；导航独立评审后重拍 6 张整页图并重生派生特写，记录前后哈希后建立新金样 |
| §2.2“裁决规则”，原第 124 行 | 同语义组件服从 P0 与设计基线 v0.3 | 改为服从 P0 与 `07` §9 已登记修订；v0.3 仅在不冲突时适用 |
| §2.2“状态语义域与非任务页顶栏契约”，新增 | 未区分任务、审批、对象生命周期、风险裁决；非任务页无顶栏状态模型 | 新增四域映射、`data-page-state`、条件性 `data-task-state` 与 `data-status-domain` 契约 |
| §2.3“分批、依赖与组件策略”，新增 | fixture 字段只随批次出现 | 批次 1 前冻结批次 1–4 共用 ID、状态枚举和引用字段；不提前实现后续页面 |
| §2.3“批级验收”，原第 157–162 行 | 批内依赖未设门禁；主状态图未指定主题 | 增加批次 1–4 串行门禁；正式主图固定浅色，深色放 `/tmp` 并实测新增元素对比度 |
| §2.3“跨页因果状态账本”，新增 | 仅传对象/fixture ID，未定义跨页前态与后态 | 增加 `scenarioId + stage` URL 账本，以及 AC-09、AC-13、AC-15 的继承字段、动作和前后断言 |
| §2.4“可演示边界”，原第 188–189 行 | 先写“UI 故事层可覆盖 16/16”，下一行才限定 fixture | 把 AC-03/04/09/13/14/15/16 的确定性 fixture 限定写入 16/16 原型演示结论本句 |
| §2.5“B 档范围冲突登记”，新增 | 阶段 2 CRUD/单动作与阶段 3“只做展示”未裁决 | 登记负责人裁决：三张 B 档页做到 CRUD/单动作，阶段 3 表述只约束线框裁剪 |
| §2.5“B 档范围冲突登记”，追加 | 未登记负责人裁决与 `07-layout-revision-proposal.md:344,468` 的“不可点击”约束冲突 | 登记负责人裁决取代 07 的 B 档不可点击约束；07 相应条款待阶段 4 后续轮次按 07 §9 流程同步修订 |
| §2.6“主要风险”，原第 195–200 行 | 使用“七图”“重跑 P0”和 B 档“数据展示 + CRUD”旧措辞 | 改为 6 张整页 + 派生特写、执行 manifest/像素门禁，并引用负责人 B 档裁决 |
| §2.1“P0 抽取门禁”实施偏差登记，追加 | 6 个 JS 按引用顺序裸拼接缺少原 `<script>` 外层 IIFE 两行共 23 字节：`scratch/sample-dialog-batch3.html:129` 的 `(() => {`（13 字节）与 `scratch/sample-dialog-batch3.html:510` 的 `})();`（10 字节） | 补回两行后，6 个独立经典脚本分别解析失败，门禁为 `pass=0 fail=77 consoleErrors=231`，补丁已撤回；补回后的拼接结果可精确重建原版 75652 字节，SHA-256 `b5617ebaa2dfc4947b1aedb0fa887d4914fdcd94fd4c19dd8e0686409fec72e9`，`compare=0`。负责人接受该偏差：门禁第 2 条“逐字搬出 JS”在“6 个独立经典脚本”结构下不把外层 IIFE 作为搬运对象。复评其余门禁记录为功能 77/77、7 张 `different_pixels=0`、无新建页面、无文档或正式图改动，范围与离线门禁通过。 |
