# 视觉设计 Skill 安装与样张实测报告

> 日期：2026-09-18  
> 工作目录：`/Users/test/code-workspace/ai-risk-pm-career`  
> 结论：已安装 3 个通过 ClawHub 验证的 skill；拒绝安装 1 个可疑 skill。已用 `minimalist-ui` 的完整 QA 口径和 `awesome-design-of-great-product-company` 的受限参考能力完成现有样张实测。现有样张可作为结构样张，但**未达到视觉定稿门槛**。

## 1. 搜索与验证记录

已逐条执行：

```sh
openclaw skills search "frontend design"
openclaw skills search "UI design system"
openclaw skills search "design review"
openclaw skills search "dashboard design"
```

搜索结果很多，但大部分与四个预筛候选重叠，或标有 `Not scanned by ClawHub`。为减少供应链面，本轮只把四个预筛项列为候选，没有安装未扫描候选。

首次直接执行 `verify` 时，四项都被 CLI 前置校验挡住：本机配置了多个 agent，必须显式传 `--agent <id>`。这不算 skill 验证失败。确认当前工作主体为 `codex` 后，统一使用 `openclaw skills verify --agent codex --json <skill-ref>` 重跑。

| 候选 | 版本 | Verify 结论 | 安全摘要 | 安装决定 |
|---|---:|---|---|---|
| `@aa-on-ai/design-review` | 1.1.0 | **fail**；`security.status_not_clean`；`suspicious`，high confidence | 扫描发现未披露的自动脚本执行、由环境变量控制的静默遥测 / 有限 blind SSRF，以及过宽的自动激活、memory 读写指令 | **拒绝安装** |
| `@mes28io/minimalist-ui` | 0.1.0 | **pass**；`clean / benign`，high confidence | 纯 Markdown 设计与 QA 指南；无可执行行为或敏感访问 | 安装 |
| `@openlark/ui-scanner` | 1.0.1 | **pass**；`clean / benign`，high confidence | 对用户指定 URL 做设计系统抽取，并写本地设计规格 | 安装 |
| `@mebusw/awesome-design-of-great-product-company` | 1.0.0 | **pass**；`clean / benign`，high confidence | 静态品牌设计参考库；未发现隐藏指令、执行载荷、持久化或数据外传 | 安装 |

三项通过项均为 unsigned，且 ClawHub 未保存可用的 server-resolved GitHub provenance；本轮因此固定安装已验证的确切版本，没有安装 `latest` 漂移版本。

## 2. 安装结果与落点

安装命令显式绑定 `codex` agent，未使用 `--global`：

```sh
openclaw skills install --agent codex --version 0.1.0 @mes28io/minimalist-ui
openclaw skills install --agent codex --version 1.0.1 @openlark/ui-scanner
openclaw skills install --agent codex --version 1.0.0 @mebusw/awesome-design-of-great-product-company
```

| Skill | 实际安装位置 | 本地元数据确认 |
|---|---|---|
| `minimalist-ui` | `/Users/test/.openclaw/workspace/codex/skills/minimalist-ui` | `_meta.json` 与 `.clawhub/origin.json` 均为 0.1.0 |
| `ui-scanner` | `/Users/test/.openclaw/workspace/codex/skills/ui-scanner` | `_meta.json` 与 `.clawhub/origin.json` 均为 1.0.1 |
| `awesome-design-of-great-product-company` | `/Users/test/.openclaw/workspace/codex/skills/awesome-design-of-great-product-company` | `_meta.json` 与 `.clawhub/origin.json` 均为 1.0.0 |

这是 **OpenClaw `codex` agent workspace 级安装**，不是 workspace 仓库内安装，也不是 shared global 安装；不会自动分发给 `main`、`investment` 等其他 agent。第三项首次命令在下载阶段超过调用窗口，但 OpenClaw 生命周期随后完成提交；重试返回 `Skill already exists`，本地版本与 origin 哈希完整，因此未使用 `--force` 覆盖。

## 3. 每个 Skill 的真实能力边界

### 3.1 `minimalist-ui`：本项目默认视觉质量门

**能做：** 为 dashboard、chat interface、agent control panel 提供低噪音、高密度设计方法；明确 typography / spacing / radius / elevation / component 行为；用 pass/fail 清单检查单一主动作、空 / 加载 / 错误态、键盘焦点、对比度、点击目标、响应式和 token 显式性。

**不能做：** 它不是渲染器、浏览器自动化器或像素检测器；不会自己看截图、量 DOM、改 HTML 或证明交互可运行。其 OpenAI / Notion 极简取向也不能覆盖本项目既有基线，更不能成为复制品牌视觉的许可。本轮只采用其方法和 QA 清单，配色与产品语义仍以本项目文档为准。

### 3.2 `ui-scanner`：外部页面设计系统抽取器

**能做：** 对用户提供且可访问的 URL 抓取 HTML / CSS，按风格、色彩、字体、间距圆角、可见组件、Do / Don't 六个维度整理，并按 `{domain}_design.md` 输出结构化规格；无法直接抽取的值必须标 `estimated` 和推断依据。

**不能做：** 它不以截图为唯一输入，不是无障碍或产品语义审查器；重 JS 页面、不可访问 CSS、hover / 动效会限制精度；不能凭空补不存在的组件。本任务只允许写本报告，而且输入是本地 HTML + PNG，所以**没有运行其“写 `{domain}_design.md`”流程**，避免额外落文件。能力边界已通过完整读取其 `SKILL.md` 与五份 references 核实。

### 3.3 `awesome-design-of-great-product-company`：品牌参考查询库

**能做：** 从包内 60 个品牌目录读取静态 `DESIGN.md`，返回配色、字体、组件、布局、Do / Don't 和 Agent Prompt。本轮按项目参照文档出现的品牌实际读取了 `linear.app/DESIGN.md` 与 `stripe/DESIGN.md`，确认查询链可用。

**不能做：** 它不是自动评审器或权威官方规范。Skill Card 明示这些材料是非官方近似，公开 / 商业使用前仍需核对官方指南。本项目的《产品参照调研》第 6 节禁止复制品牌视觉，因此只借其“单一交互色、成功绿只作状态、暗色用亮度层级而非重阴影、数据区使用等宽数字”等通用检查语言，**不采用 Linear / Stripe 的品牌色、字体或组件外观**。

## 4. 样张实测范围与判定口径

本轮完整读取并交叉核对：

- `stage-4-prototype/03-design-baseline.md`
- `stage-4-prototype/01-product-reference-research.md`
- `prototype/samples/sample-dialog.html`
- `stage-4-prototype/screenshots/sample-dark.png`
- `stage-4-prototype/screenshots/sample-light.png`
- `stage-4-prototype/screenshots/sample-dark-error.png`
- `stage-4-prototype/screenshots/sample-light-error.png`

四张 PNG 均已实际打开查看，不是只看文件名或尺寸。

任务文字所称“`03-design-baseline.md` 第 4 节状态色规则”与当前文件编号不一致：该文件第 4 节是字体与数字（104–119 行），状态规则实际在第 3.3 节（97–102 行）；《产品参照调研》的状态色规则才在第 4 节（131–140 行）。本轮三处都检查，没有擅自改文档编号。

**屏幕意图：** 让策略 / 模型团队在一个视野内监控并干预正在执行的模拟验证任务，同时看见工具授权、证据链、正式对象和在线侧边界。

**总评：** 信息架构成立、治理边界清楚、异常卡可恢复；但颜色角色、文本可读性、焦点、控件尺寸、加载表现和视觉降噪仍有明显缺口。当前适合继续迭代，不宜直接选为其余 13 个界面的视觉母版。

## 5. 未达到基线的具体问题

| 级别 | 位置（源码 / 截图） | 未做到什么 | 建议修法 |
|---|---|---|---|
| P0 | HTML 20、38–39、43、57、61、63、67–69 行；浅色主态与浅色错误态 | 浅色 `--text-3: #8792A3` 在白底对比度实算仅 **3.15:1**，却用于 9–10px 的时间、对象元数据和辅助标签，不满足 `minimalist-ui` 的 WCAG AA 门，也低于基线“辅助文字 11/16px”。深色同组合为 4.55:1，只是贴线通过。 | 把浅色辅助文字提升到小字 ≥4.5:1，并把关键元数据恢复到至少 11/16px；极弱文字只用于非必要装饰信息。 |
| P0 | HTML 49、52、64–66 行；两版所有屏 | 没有统一 `:focus-visible`；输入框还显式 `outline:0`。键盘用户无法识别主题、状态、暂停、恢复、发送和对象入口的焦点。 | 为所有 button / input / link-like control 增加高对比 2px focus ring + offset；不得只靠 hover。 |
| P1 | HTML 49、52、65 行；顶部主题 / 七态、错误态动作 | 主题键、状态键和恢复按钮高度均为 28px，低于基线 32–36px，也低于新 skill 的 compact 36–40px 建议。 | 统一到至少 36px；若担心 960px 高度，优先压缩非交互间距，不压点击目标。 |
| P1 | HTML 13–14、37、41、60–66 行；深色主态 | 暗色 `accent #45D6A2` 与 `success #65D69B` 视觉过近：品牌标、导航选中、进度、链接、发送按钮和“完成”状态都呈绿系，违反“成功绿不能作为普通品牌装饰”的识别目标。 | 先解决基线内部的绿系冲突：主操作改为与成功绿明显分离的运行青 / 蓝，或把成功限定为带 check 的状态标识；同一处理状态的标签与进度轨使用同一色。 |
| P1 | HTML 32、68、89、134 行；四张截图 | “个人作品 · 虚构模拟数据”和静态“在线侧边界”都使用 warning 琥珀色 / 虚线，抢占了“待确认 / 审批中”的语义色。 | 静态说明改中性边框与文字；只有流程被人或条件阻塞时才使用琥珀色。诚实标识可用中性盾牌 + 固定位置保证可见。 |
| P1 | HTML 47、57、61、63、67–69 行；主态两屏 | 页面标题为 20/26px，不是基线 22/30px；大量区块 / 元数据降到 9–10px，弱化过度。截图中右栏时间、辅助文案和步骤小字需要费力辨认。 | 回到基线字阶：页面 22/30，区块 15/22，UI 标签 12/18，辅助 11/16；只保留极少 10px overline。 |
| P1 | HTML 69、165 行；加载态（URL `state=loading`） | 加载态以无限旋转 spinner 为主要视觉，布局没有保持最终计划卡骨架；不符合新 skill 的“按最终布局做 skeleton”，也弱于参照文档“不能用无限旋转替代真实状态”。虽有“语义匹配 / 授权核验”文字，但视觉仍不稳定。 | 显示与计划卡同尺寸的 skeleton、当前阶段、已耗时和取消入口；spinner 仅作次级提示。 |
| P2 | HTML 14、58、69 行；尤其浅色主态 | 所有普通卡片统一使用 `0 12px 30–32px` 大阴影。对运营页而言层级偏重，与 skill 的“边框 + 轻表面色优先，level-2 只给浮层”不符。 | 默认卡片去阴影或降为 0 1px 2px；只给 toast / dialog / popover 浮层阴影。 |
| P2 | HTML 68、128–132 行；四张截图右栏 | 四个正式对象都被做成同权卡片，形成小型“同质卡片墙”；与参照调研“高密度不等于重边框、不要同质卡片墙”有偏差。 | 改为带分隔线的紧凑对象列表，用选中条、ID、状态和时间建立层级；只给真正需处理的对象独立卡片。 |
| P2 | HTML 69、167 行；两张错误态截图 | `.state-panel` 垂直居中使错误卡上下留下大片无信息区域；异常时反而丢失任务上下文，和“高密度但不拥挤、先看结果再看过程”不一致。 | 错误卡靠内容区顶部 20–24px；下接已完成步骤、保留产出和证据对象摘要，仍保持一屏完整。 |
| P2 | HTML 37、48–50、56、58、61、65–69 行 | 圆角实际混用 3 / 5 / 6 / 7 / 8 / 10 / 999px，超出基线 6 / 10 / 14px 的分层意图，也削弱组件家族一致性。 | 功能控件统一 6px，卡片 10px，重点容器 14px；999px 仅留状态 pill，取消 3 / 5 / 7 / 8 的零散值。 |
| P2 | HTML 30、34、71 行；当前只验收 1200px | 页面 `min-width:980px` 且全局 `overflow:hidden`，除 reduced-motion 外没有响应式规则；未实现基线所写的 `<980px` 右栏抽屉和 `<760px` 左栏折叠。 | 正式原型铺开前补两个断点；样张阶段可保留 1200px 截图门，但不能把它当成已完成响应式。 |
| P2 | HTML 115–116、123、129–132 行；主态两屏 | “屏幕唯一主动作”不清楚：暂停是 ghost，发送按钮常亮，右栏四个链接同时用 accent；用户 5 秒内不易判断是继续观察、暂停还是追加需求。 | 把屏幕主任务明确为“监控并干预执行”：运行时暂停 / 继续为上下文主动作；发送按钮仅在有输入时升为主色；对象跳转降为中性文本链接。 |

## 6. 已做到的部分

### 6.1 状态规则

- 错误态合格：HTML 167 行和两张错误截图同时显示失败步骤、原因、保留结果以及重试 / 改参数 / 换工具，没有只放红点。
- 审批 / 待生成与降级已分开：HTML 60、69、132、170 行分别使用琥珀标签和蓝灰虚线，文字也不相同。
- 七种状态均有文字入口（HTML 119–120 行），关键异常有图标，不靠颜色单独表达。
- 暂停 / 旧参数使用中性灰，并明确“旧参数产出已保留但不并入新结论”（HTML 163 行）。

### 6.2 《产品参照调研》第 6 节“明确不借鉴”

- **未复制品牌视觉：** 页面没有 Stripe / Linear / Notion / OpenAI 的 Logo、品牌名或专有组件；包内品牌参考没有被写回样张。
- **未使用大片色彩渐变、玻璃拟态或满屏发光：** HTML 45 行是低透明度网格纹理，不是品牌渐变；页面无 `backdrop-filter` 或 glow。该网格仍属于装饰，可在下一轮按“每个元素必须有理由”再决定是否保留。
- **模拟数据没有包装成生产数据：** HTML 6–7、89–90、127–135、155–170 行重复标明“虚构 / 模拟 / 演示环境 / 非验证结论”。
- **没有展示隐藏思维链：** 只呈现工具、步骤、输入摘要、状态和恢复动作，没有模型内部推理文本。
- **没有新增冻结总账外页面：** 左侧导航只出现既有在线风控与工作台对象；七态切换是同一页面的样张控制，不是新页面。

### 6.3 结构与治理

- 220px 左栏 + 弹性主区 + 274px 右栏符合三栏基线（HTML 34 行）。
- 首屏同时看到计划、进度、中断反馈、正式对象和在线侧边界，证明“对话是操作台”。
- 右栏 ID、状态、时间和边界稳定可见；错误态不强行生成结论。

## 7. 实测说明与未跑通项

1. **已实际应用：** 本次逐项使用 `minimalist-ui/references/qa-checklist.md`，并结合其 design tokens、layout patterns、component specs 对 HTML 与四张实图做了评审；上表就是实测产物，不是复述 skill 简介。
2. **品牌参考能力已实读：** `awesome-design` 的 Linear / Stripe 参考能正常读取，但它们与本项目“不复制品牌视觉”的边界冲突时，本项目基线优先。
3. **`ui-scanner` 未跑写文件流程：** 它要求 URL 输入并固定写 `{domain}_design.md`；本任务禁止产生第二份报告，因此没有伪称“已扫描”。后续只有在用户提供外部 URL 且授权目标输出文件时才调用。
4. **`design-review` 未安装：** 原因是 verify 明确失败并给出高置信可疑结论，不是下载故障。
5. **OpenClaw live-agent 调用未作为验收手段：** 本机 `DEEPSEEK_API_KEY` 当前缺失，`openclaw skills list --agent codex` 还遇到本地 gateway `EPERM`；因此没有声称通过 OpenClaw 模型回合自动触发。安装回执、本地 origin / version / hash、完整技能说明读取和本次人工执行链已经验证静态 skill 可用性。

## 8. 后续视觉任务的固定工作方式

本项目后续视觉任务由 Codex 承担时，采用以下顺序：

1. 先读本项目设计基线与对应产品规格，项目事实和治理语义优先。
2. 用 `minimalist-ui` 做 intent → primary action → skeleton → semantic color → QA gate，不直接套其 OpenAI / Notion 风格 token。
3. 只有需要研究某个公开 URL 时才用 `ui-scanner`，并明确推断项和输出路径。
4. 只有需要参考某品牌的通用设计语言时才查 `awesome-design`；结果视为非官方近似，且不得复制品牌配色、Logo、字体或专有组件。
5. 每轮视觉交付必须同时检查源码、真实渲染截图、状态分支、键盘焦点、对比度、尺寸 / 裁切和模拟数据标识。
6. `@aa-on-ai/design-review@1.1.0` 保持拒装；除非未来版本重新 verify 为 clean，且已消除静默遥测和过宽指令，否则不使用。
