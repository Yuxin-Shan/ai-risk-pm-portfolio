# 对话窗口双主题样张说明

> 样张日期：2026-09-20（状态内核、主交互闭环与执行侧栏口径同步）  
> 项目属性：个人作品；页面中的业务情境、案件、对象、指标与数字全部为虚构 / 模拟，不代表真实生产系统或上线效果。

## 1. 两版主题的取舍

- **Obsidian Signal（深色）**：以 `#080D12` / `#0D141B` 哑光深灰承载夜间值守和运行状态，主操作改为明确蓝色 `#4C9AFF`，绿色 `#65D69B` 只表示成功；不使用霓虹渐变或发光边框。异常红、待处理琥珀与运行蓝各守其职，普通边框保持低噪音。
- **Paper Ops（浅色）**：以白色工作面和 `#EFF2F6` 画布强化长时间阅读、表格化对象与面试投屏；深蓝用于主动作和当前步骤，窄导航、对象编号、细分隔与纸张层次避免变成无差别卡片墙。
- 两版共享同一份 HTML、DOM、内容与交互，只替换 CSS token。状态同时使用文字、图标、边框形态与颜色，不靠颜色单独传意。静态免责声明已回归中性文字色，琥珀只用于等待、审批、超时和真正警示。

### 1.1 本轮三处修订

1. **全局可读与可操作基础层**：桌面页标题由 20/26px 改为 22/30px，右栏标题由 14px 改为 15px；辅助文字统一不低于 11px，UI 标签与按钮文字统一到 12px。主题、暂停、状态按钮改为 36px；错误恢复普通按钮 36px、主动作 40px；发送按钮 44×44px。所有按钮和输入框补统一 2px `:focus-visible` 焦点环，输入框不再使用 `outline:0`。
2. **语义颜色**：深色主操作由 `#45D6A2` 改为蓝色 `#4C9AFF`，成功色继续为 `#65D69B`；深色辅助字改为 `#82939D`。浅色辅助字改为 `#5F6C80`；warning / danger / success 正式统一为源码已验证的 `#9A5409` / `#B93645` / `#126F4D`，并同步写入设计基线 v0.2。
3. **状态页与右栏层级**：错误卡从垂直居中改到状态区上部，增加已有任务编号与进度上下文，但不扩写错误内容；右栏由四张同质卡改为“主实验展开 + 三个次对象紧凑行”。对象入口改成原生 `<button>`；主题使用 `aria-pressed`，七态使用 `tablist` / `tab` / `aria-selected` 并支持方向键。新增 979px 右栏抽屉和 759px 左栏抽屉断点，主内容与对象栏可滚动。

加载态仍保留当前动作和授权核验文字；spinner 从 `.8s linear infinite` 改为 `.65s ease-out` 仅播放一次，不再以无限旋转替代状态说明。卡片阴影未扩大。

### 1.2 对比度复算

使用 `web-accessibility/scripts/check-contrast.mjs` 按 WCAG 普通文字 4.5:1 阈值复算：

| 色对 | 实测 | 结论 |
|---|---:|---|
| 深色 `#82939D` / 卡片 `#121C25` | `5.42:1` | 通过；旧值 `#71808A` 为 4.232:1。 |
| 浅色 `#5F6C80` / 白色 `#FFFFFF` | `5.33:1` | 通过。 |
| 浅色 `#5F6C80` / 卡片 `#F8FAFC` | `5.09:1` | 通过。 |
| 浅色 `#5F6C80` / hover `#EEF3F8` | `4.77:1` | 通过，为三层表面最低值。 |
| 浅色 `#5F6C80` / 页面 `#EFF2F6` | `4.74:1` | 通过。 |
| 深色主操作 `#4C9AFF` / `#0D141B` | `6.51:1` | 通过。 |
| 深色成功 `#65D69B` / `#0D141B` | `10.28:1` | 通过。 |

按钮前景同样复算：深色 `#071522` / `#4C9AFF` 为 `6.47:1`，浅色白字 / `#285BC7` 为 `6.16:1`。

## 2. 演示状态怎么触发

正式界面不显示主题切换器或常驻状态切换条。主题由 `?theme=dark|light` 控制；状态由 `?state=` URL fixture 直达，未传时为运行态。`?demo-controls=1` 仅供测试时显示布局外演示浮层。

| 状态 | URL 参数 | 样张表现与规格映射 |
|---|---|---|
| 空会话 | `state=empty` | 居中多行输入框与三条完整示例指令 |
| 核对中 | `state=loading` | “正在核对数据集、工具与授权…”，尚未生成待确认计划 |
| 等待确认 | `state=confirm` | 待确认计划、范围、耗时和确认 / 改参数 / 取消动作 |
| 执行中 | `state=normal` 或省略 | 折叠计划摘要、机制卡、中断记录、结构化结果与右栏实时步骤 |
| 已暂停 | `state=paused` | 当前步骤暂停，已有结果保留 |
| 已完成 | `state=completed` | 四步结束并展示验证报告产出 |
| 错误 | `state=error` | 标出失败步骤、原因、已保留产出与重试 / 改参数 / 换工具动作 |
| 超时 | `state=timeout` | 必需工具取证超时，不强行裁决，转 FR-06 / AC-12 待人工队列 |
| 越权 | `state=unauthorized` | 候选工具未授权而禁用，未授权调用保持为 0，并指向授权包路径 |
| 降级 | `state=degraded` | 可选工具“名单匹配”失败，证据链标缺失后继续；证据不足仍须转人工 |

主题使用 `theme=dark` 或 `theme=light`；例如：`sample-dialog.html?theme=light&state=error`。

## 3. 四个机制的落点

1. **工具选择**：正常态左下卡片先显示语义候选，再标出当前 Agent + 版本下的授权状态；未授权工具可见但禁用。
2. **待确认 / 中断**：首次提交先进入待确认计划；确认后计划原地折叠。暂停、继续、运行中改参数和取消均经过同一状态内核，中断记录保留旧参数产出。
3. **证据链嵌入**：主区保留结构化证据摘要；右栏实时步骤是运行进度的唯一主视图，完整产出进入静态安全 `outputViewer`。
4. **产出落地**：右栏按“当前状态 / 实时步骤 / 最新产出 / 对象 / 能力事实”排列；对象列表为次要区块，能力事实仅在底部显示一次，不设置“在线侧边界”说明块。

## 4. 截图复现

在仓库根目录 `/Users/test/code-workspace/ai-risk-pm-career` 执行：

```sh
BROWSER='/Users/test/.cache/puppeteer/chrome-headless-shell/mac_arm-152.0.7977.75/chrome-headless-shell-mac-arm64/chrome-headless-shell'
PAGE='file:///Users/test/code-workspace/ai-risk-pm-career/prototype/samples/sample-dialog.html'

"$BROWSER" --no-sandbox --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,960 --screenshot=stage-4-prototype/screenshots/sample-dark.png "$PAGE?theme=dark"
"$BROWSER" --no-sandbox --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,960 --screenshot=stage-4-prototype/screenshots/sample-light.png "$PAGE?theme=light"
"$BROWSER" --no-sandbox --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,960 --screenshot=stage-4-prototype/screenshots/sample-dark-error.png "$PAGE?theme=dark&state=error"
"$BROWSER" --no-sandbox --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,960 --screenshot=stage-4-prototype/screenshots/sample-light-error.png "$PAGE?theme=light&state=error"
"$BROWSER" --no-sandbox --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,960 --screenshot=stage-4-prototype/screenshots/sample-light-running.png "$PAGE?theme=light&state=normal"
"$BROWSER" --no-sandbox --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,960 --screenshot=stage-4-prototype/screenshots/sample-light-confirm.png "$PAGE?theme=light&state=confirm"

cp stage-4-prototype/screenshots/sample-light-running.png stage-4-prototype/screenshots/sample-light-rail.png
sips --cropToHeightWidth 560 700 --cropOffset 40 500 stage-4-prototype/screenshots/sample-light-rail.png >/dev/null
sips --resampleHeightWidth 960 1200 stage-4-prototype/screenshots/sample-light-rail.png >/dev/null
```

最终七张 PNG 均为 `1200 × 960`、单张小于 1MB：dark `178,258` bytes、light `184,872` bytes、dark-error `155,752` bytes、light-error `163,393` bytes、light-running `184,872` bytes、light-confirm `125,076` bytes、light-rail `283,093` bytes。六张完整页面的 `documentElement` 均为 `scrollHeight = clientHeight = 960`，主内容区为 `753 = 753`、右栏为 `916 = 916`，输入区底边为 `960px`；右栏特写由同一张桌面运行态截图裁取并等比重采样，仅突出当前状态、实时步骤与最新产出。

## 5. 刻意简化

- 这是视觉与交互样张，不是成品：导航和对象跳转只提供按钮反馈，不铺开其余界面。
- 不连接后端、不执行真实工具、不持久化状态；所有反馈均为浏览器内模拟。
- 只演示对话窗口所需的计划、进度、中断、证据链和对象落地；未实现完整权限体系、性能、高可用、审计合规与真实数据一致性。
- 为保证单文件离线复验，图标、CSS、JavaScript 全部内联，不加载字体、CDN、图表库或其他外部资源。
- 错误截图选用“执行失败”作为异常态代表；其他状态使用 `?state=` 直达，不在正式界面放置状态切换条。

## 6. 共享逻辑缺陷修订（2026-09-18）

本节保留当日状态一致性与抽屉键盘修订记录；当前三轴状态模型、URL fixture 与执行侧栏口径以设计基线 v0.3 和下节记录为准。

本轮只改 DOM 状态挂点与 JavaScript；CSS、颜色 Token、字号、按钮高度、焦点样式、`979px` / `759px` 断点和布局结构均未改动。

### 6.1 状态一致性

运行信息收敛到单一 `appState`（`view`、`run`、`updatedAt`），每次变化统一由 `render()` 更新主区、进度徽章、证据步骤、暂停按钮、右栏四个对象及其更新时间。右栏任务组当前状态单独显示；历史“曾暂停”只保留在元信息中。

| 自查场景 | 主区状态 | 进度徽章 / 状态栏 | 右栏对象当前状态（实验 / 任务 / 证据 / 报告） | 更新时间 |
|---|---|---|---|---|
| 正常态 | 正在读取 DS-19；证据步骤 02 执行中 | `执行中 2/4` / `处理中` | `执行中` / `执行中` / `执行中` / `待生成` | 初始均为 `23:08` |
| 错误态 | `步骤 3 执行失败` | `执行失败`；顶部为 `执行已停止` | `已中断` / `执行失败` / `前 2 步保留` / `未生成` | 切换时四处同步；实测 `11:12` |
| 暂停后 | `任务已暂停，等待继续`；步骤 02 已暂停 | `已暂停 2/4` / `已暂停` | `已暂停` / `已暂停` / `已暂停` / `待生成` | 点击时四处同步；实测 `11:12` |
| 继续后 | 恢复正在读取 DS-19；步骤 02 执行中 | `执行中 2/4` / `处理中` | `执行中` / `执行中` / `执行中` / `待生成` | 点击时四处同步；实测 `11:12` |

点击暂停 / 继续会共同修改 `run`、`updatedAt`，并据此重绘计划徽章、进度标题与徽章、进度条语义色、进度辅助说明、证据步骤 02、暂停按钮文案与 `aria-pressed`、右栏三个执行对象及四个对象时间戳。切换到错误等非正常态时，顶部按钮也显示该态对应的不可执行文案，不再暗示仍可暂停一个已停止任务。

### 6.2 抽屉键盘状态

- 左抽屉绑定既有 `max-width: 759px`，右抽屉绑定既有 `max-width: 979px`；媒体查询之外移除 `inert`，不影响桌面栏内操作。
- 折叠且关闭时在对应面板设置原生 `inert`，其内部按钮不会进入 Tab 顺序；打开时移除 `inert`，并在下一帧将焦点移到抽屉内首个可聚焦元素。
- 点击触发按钮再次关闭或按 Escape 关闭时，重新设置 `inert`，并把焦点归还对应触发按钮；原有 Escape 行为保留。
- 真实浏览器实测：759px 初始左右面板均为 `inert`；左栏打开后焦点到“策略引擎”，右栏打开后焦点到“打开实验详情”；两者按 Escape 后均关闭、恢复 `inert` 并归还焦点。

## 7. 状态内核、主交互与执行侧栏变更记录（2026-09-20）

- 状态收敛为 `sessionPhase / runState / workspaceMode / runFlags.degraded`，24 个 transition 统一经过 `dispatch → reducer → assertState → render`；时间 fixture 固定为 `23:08`。
- 同一 `textarea` 在新会话居中、进入会话后固定到底部；首次提交依次经过核对、待确认计划、确认 / 改参数 / 取消，Enter 发送、Shift+Enter 换行，composition 期间不误发。
- 顶栏状态指示器是全局状态入口；计划卡不重复同义 badge。任务标题无计划时为“对话操作台”，有计划时由第一条用户消息派生。
- 右栏改为运行中实时进度主视图；列内只预览最新一项，不显示表格、代码块、长引用、目录或多产出切换器。完整产出在主区静态安全查看态打开，Escape 返回并归还焦点。
- 正式交付保留四张原主题 / 异常图，并增加运行态、待确认态与右栏特写三张证据图；旧四图保存在 `scratch/screenshots-2026-09-18/`。
