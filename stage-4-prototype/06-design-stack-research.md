# 产品设计 Skill 栈调研与安装记录

> 执行时间：2026-09-18 08:48–08:59（Asia/Shanghai）  
> 安装范围：OpenClaw `codex` agent workspace  
> 安全门槛：仅安装 ClawHub `decision=pass` 且 `security.status=clean` 的固定版本；`suspicious` / `fail` 一律拒装。  
> 仓库约束：本轮未改动样张、截图、阶段 1–3 或 `05-visual-skill-setup.md`。

## 1. 结论

本轮按 A → C → B → D 顺序搜索和验证，共实质验证 17 个候选，安装 6 个：

1. A 设计产出：`product-prototype-design@1.0.0`
2. C 设计资产：`type-scale-generator@0.1.1`、`color-system@0.1.0`
3. B 设计评审：`ui-audit@1.0.1`、`web-accessibility@0.1.1`
4. D 产品流程兜底：`product-ux-workflow@0.1.0`

六项均为 clean/pass、高置信度扫描结果，并固定版本安装。它们与上一轮已有的 `minimalist-ui@0.1.0`、`ui-scanner@1.0.1`、`awesome-design-of-great-product-company@1.0.0` 组合后，覆盖“需求与流程 → 信息层级 → token → 单文件原型 → UI/无障碍评审”。没有安装功能重叠、依赖更重或扫描可疑的候选。

需要诚实限定：ClawHub 的 clean 扫描说明“未发现已知危险行为”，不等于作者身份或维护质量得到密码学担保；本轮候选普遍为 unsigned，部分没有可用的 server-resolved GitHub provenance。因此安装时同时依赖了范围匹配、文件清单、依赖面和实测结果，而不是只看名称。

## 2. 调研与筛选

### 2.1 A：设计产出类

搜索词：`prototype`、`HTML prototype`、`interactive prototype`、`product prototype design`、`hi-fi mockup`。

| 候选 | 版本 | Verify | 决定 | 理由 |
|---|---:|---|---|---|
| `@yz6214589-hash/product-prototype-design` | 1.0.0 | pass / clean / benign / high | 安装 | 直接面向单文件 HTML、高保真和交互状态；无执行脚本或安装依赖。其默认 Tailwind CDN/Chart.js 建议与本项目零外部依赖冲突，使用时必须以本项目基线覆盖该默认值。 |
| `@ckchzh/prototype` | 3.4.1 | fail / suspicious / high | 拒装 | 脚本把命令行输入未经转义写入 HTML、JS、CSS，扫描指出存储型 HTML/脚本注入风险。 |
| `@cced3000/claude-designer` | 1.0.0 | fail / suspicious / high | 拒装 | 原型指引可加入远程脚本和 AI 调用，缺少清晰告知。 |
| `@jimliu/baoyu-design` | 1.0.1 | fail / suspicious / high | 拒装 | 可把第三方设计系统文本转成 agent 指令，并包含不安全的远程代码/脚本执行路径。 |

没有选择 Flutter/SwiftUI/React 多框架工厂类：当前 11 个界面的既定载体是原生 HTML/CSS/JS，扩大框架面只会增加依赖与交付漂移。

### 2.2 C：设计资产类

搜索词：`design token`、`icon library`、`component library`、`color system`、`design system`。

| 候选 | 版本 | Verify | 决定 | 理由 |
|---|---:|---|---|---|
| `@monikazapisek/type-scale-generator` | 0.1.1 | pass / clean / benign / high | 安装 | 单一职责：以比例生成可审计的字号 token，并明确原值、取整值和 12px 下限；补齐既有栈的字体尺度缺口。 |
| `@fize/color-system` | 0.1.0 | pass / clean / benign / high | 安装 | 提供语义色、双主题 token 模板和 WCAG 阈值；与现有基线直接对接。 |
| `@ivangdavila/design-system` | 1.0.0 | pass / clean / benign / high | 不装 | 会维护额外本地设计偏好目录，且 token/组件文档能力与 `minimalist-ui`、现有基线重叠。 |
| `@paudyyin/ui-design-system` | 1.0.0 | pass / clean / benign / high | 不装 | 主要是多套预设主题参考；对已经定稿的深/浅主题增量有限，并带网络占位符提示。 |

既有工具链通过官方 npm registry 复核：

| 工具 | 当前版本 / registry 修改时间 | 本轮结论 |
|---|---|---|
| `lucide-static` | 1.47.0 / 2026-09-17 | 保留首选。继续按图标逐个内联 SVG，不引全包。 |
| `echarts` | 6.1.0 / 2026-05-19 | 保留为监控、实验、报告页的按需增强；图表必须有表格/文字回退。 |
| `@picocss/pico` | 2.1.1 / 2025-03-15 | 仍可做语义 HTML 辅助，但维护新鲜度弱于其他项，也难满足高密度控制台定制；不作为 11 页核心。 |
| `@tailwindcss/browser` | 4.3.3 / 2026-09-08 | 活跃，但浏览器/CDN 运行模式与本项目“单文件、零外部依赖”冲突；只适合临时探索，不进入交付。 |
| `@shoelace-style/shoelace` | 2.20.1 / 2025-03-11 | 继续拒绝。既有调研记录其维护终止风险，当前 registry 修改时间也没有反转这一判断。 |

因此没有往项目安装 Lucide/ECharts/Pico/Tailwind：当前样张明确要求零外部依赖，安装却不使用会制造伪依赖。需要 ECharts 的具体页面开始实现时，再以锁版本、本地 vendoring 和回退表格为准入条件。

### 2.3 B：设计评审类

搜索词：`accessibility audit`、`design QA`、`visual review`、`UI audit`。

| 候选 | 版本 | Verify | 决定 | 理由 |
|---|---:|---|---|---|
| `@tommygeoco/ui-audit` | 1.0.1 | pass / clean / benign / high | 安装 | 覆盖视觉层级、样式一致性、认知负荷、反馈、错误恢复与无障碍；适合替代上一轮被拒的综合视觉评审 skill。 |
| `@raunakkathuria/web-accessibility` | 0.1.1 | pass / clean / benign / high | 安装 | 附带零第三方依赖的对比度脚本，能把状态色/文字色评审变成可重复的数字证据。 |
| `@mohitagw15856/accessibility-audit` | 1.0.0 | pass / clean / benign / high | 不装 | 纯清单，能力被 `web-accessibility` 覆盖，后者多一个可执行验证器。 |
| `@nicolas-m-design/wcag-21-aa-web-ui-audit` | 1.0.0 | pass / clean / benign / high | 不装 | 能力完整，但需额外安装 Playwright/axe；当前已有 chrome-headless-shell，且本轮只需要静态单页验证，依赖面不划算。 |
| `@aa-on-ai/design-review` | 1.1.0 | fail / suspicious / high | 继续拒装 | 本轮重新 verify，仍为静默遥测、未充分披露的自动脚本执行和过宽 memory 读写指令。 |

### 2.4 D：产品设计流程兜底

搜索词：`product UX workflow`、`information architecture`、`interaction design`、`user flow design`。

| 候选 | 版本 | Verify | 决定 | 理由 |
|---|---:|---|---|---|
| `@fize/product-ux-workflow` | 0.1.0 | pass / clean / benign / high | 安装 | 四阶段流程把需求、用户旅程、IA、线框、状态、视觉和交付串起来，补足“视觉 skill 很多但产品链路断开”的缺口。 |
| `@fize/interaction-design-sop` | 0.1.0 | pass / clean / benign / high | 不装 | clean，但其四态与韧性清单已被本项目七态规范、`product-ux-workflow` 和 `ui-audit` 覆盖。 |
| `@kamroncorp/propaymun-information-architecture-skill` | 1.0.4 | pass / clean / benign / high | 不装 | 模型/schema/渲染脚本完整，但当前 11 页 IA 已有阶段 2–3 文档约束；引入另一套模型会产生双口径。 |
| `@maryambahri/impeccable-uxui` | 1.0.0 | pass / clean / benign / high | 不装 | clean，但范围过宽，与 A/C/B 三层已选项高度重叠。 |

所有 `skills-sh:` 搜索结果都标为 “Not scanned by ClawHub”，不满足本轮硬门槛，未进入安装候选。

## 3. 安装结果与依赖

固定版本安装命令：

```bash
openclaw skills install --agent codex --version 1.0.0 @yz6214589-hash/product-prototype-design
openclaw skills install --agent codex --version 0.1.1 @monikazapisek/type-scale-generator
openclaw skills install --agent codex --version 0.1.0 @fize/color-system
openclaw skills install --agent codex --version 1.0.1 @tommygeoco/ui-audit
openclaw skills install --agent codex --version 0.1.1 @raunakkathuria/web-accessibility
openclaw skills install --agent codex --version 0.1.0 @fize/product-ux-workflow
```

统一落点为：

```text
/Users/test/.openclaw/workspace/codex/skills/<skill-name>
```

这属于 OpenClaw `codex` agent workspace，不是仓库内依赖，也不是 global/shared 安装。安装记录中的 archive SHA-256：

| Skill | 版本 | Archive SHA-256 |
|---|---:|---|
| `product-prototype-design` | 1.0.0 | `8441ba424d31d98592f316f13cca2511859cbc06d3229be3139991676b0043db` |
| `type-scale-generator` | 0.1.1 | `8d3bc0a81df4129996e879b4a41728120b34f920ef3566709a8dd0ac978e5afb` |
| `color-system` | 0.1.0 | `664369011752e6942d1c5364c556571a2c291f6a993d568c118458b11150b624` |
| `ui-audit` | 1.0.1 | `6a28bdd417159aeeda3b4d1dbff7e18ca069348adefc078c84ccb5cff3f70d1f` |
| `web-accessibility` | 0.1.1 | `ff245385a6ae48eb822211d771f4365e7888182dfa5e96b8d8263a733efd1dac` |
| `product-ux-workflow` | 0.1.0 | `9d533df0171a9c3db98558faec9b38173a4facc9436989c6000cccf968041f12` |

依赖结论：

- `product-prototype-design`、`type-scale-generator`、`color-system`、`product-ux-workflow` 均为 Markdown/模板型，无运行时依赖。
- `ui-audit` 的 `package.json` 没有 `dependencies` / `devDependencies`；唯一 `postinstall` 只是打印说明，OpenClaw 安装不需要额外 npm 包。
- `web-accessibility` 的脚本要求 Node ≥14、零第三方依赖。机器现有 `node v26.8.1`，已实际执行通过，因此无需再安装包。
- 没有为了“看起来完整”安装未使用的 npm 包；这避免污染仓库，也符合单文件样张的零外部依赖约束。

安装时首个批处理调用窗口在第三项后结束，后台生命周期继续完成了后三项；即时重试曾返回 `Skill already exists` / `being changed by another OpenClaw lifecycle`。随后逐项读取 `_meta.json` 与 `.clawhub/origin.json`，六项版本和哈希均完整，故未使用 `--force` 覆盖。

## 4. 实测证据

### 4.1 原型产出与运行时

对现有 `prototype/samples/sample-dialog.html` 做只读结构检查：

```text
external_refs=0
unique_states=7
unique_themes=2
mechanism_labels=机制 1 机制 2 机制 3 机制 4
simulation_labels=23
```

使用既有 Puppeteer `chrome-headless-shell` 真实加载：

```bash
/Users/test/.cache/puppeteer/chrome-headless-shell/mac_arm-152.0.7977.75/chrome-headless-shell-mac-arm64/chrome-headless-shell \
  --no-sandbox --disable-gpu --dump-dom \
  'file:///Users/test/code-workspace/ai-risk-pm-career/prototype/samples/sample-dialog.html?theme=light&state=error'
```

筛出的运行时结果：

```text
data-state="error" class="active"
data-theme="light"
执行失败
步骤 3 执行失败
```

这证明 `product-prototype-design` 所需的“单文件 + 交互状态”路径能在本项目载体上使用；但其自带示例偏好 Tailwind CDN、Chart.js 和固定输出目录，不能原样套用。本项目必须继续使用原生 CSS token、内联 SVG、原生 JS、用户指定路径和零外链。

### 4.2 字体尺度

按 `type-scale-generator` 的密集 dashboard 建议，以 13px、1.125 比例计算，得到原始值 10.272 / 11.556 / 13 / 14.625 / 16.453 / 18.510 / 20.823px；偶数取整为 10 / 12 / 14 / 14 / 16 / 18 / 20px。现有样张实际出现 9、10、11、12、13、14、16、20px，其中 9–11px 声明共 31 处。

结论：该 skill 能给出可审计的字号梯度，但它自身规定 UI 正文不得低于 12px；样张的辅助信息大量低于此下限。下一轮视觉改版应将 9–11px 合并到至少 12px 的小字 token，并重新检查 960px 高度约束，不能机械放大后造成裁切。

### 4.3 色彩与无障碍脚本

执行命令：

```bash
node /Users/test/.openclaw/workspace/codex/skills/web-accessibility/scripts/check-contrast.mjs \
  --pair '#f2f6f5,#080d12,4.5,dark primary text' \
  --pair '#a7b2b9,#080d12,4.5,dark secondary text' \
  --pair '#172033,#eff2f6,4.5,light primary text' \
  --pair '#596579,#eff2f6,4.5,light secondary text' \
  --pair '#45d6a2,#080d12,3,dark accent UI' \
  --pair '#285bc7,#eff2f6,3,light accent UI'
```

输出：六组全部通过，比例依次为 17.90、9.02、14.49、5.25、10.58、5.48:1。

继续检查三级文字与状态色：

```text
ok    4.55:1  dark tertiary on surface
FAIL  3.15:1  light tertiary on surface
ok   10.48:1  dark warning text
ok    5.76:1  light warning text
ok    6.73:1  dark danger text
ok    5.71:1  light danger text
ok   10.28:1  dark success text
ok    6.16:1  light success text
```

具体问题在 HTML 第 20 行附近：浅色 `--text-3:#8792a3` 用于白色 `--surface-1:#fff` 上的 9–10px 元数据时只有 3.15:1，未达到普通文本 4.5:1。状态色本身通过，但基线要求“颜色不能单独传义”；样张的徽标、标题和恢复动作已有文字复述，这一点符合。

### 4.4 综合 UI 审计

用 `ui-audit` 的 fidelity、visual style、feedback、error handling、accessibility 清单，结合四张 1200×960 截图和源码检查：

- 通过：主任务层级清晰；错误挂在具体步骤；错误态包含原因、保留结果和“重试/改参数/换工具”；七态切换可发现；深浅主题保持同构；截图内容未被底部裁切。
- 通过：`aria-live="polite"` 用于状态区，SVG 装饰图标多数 `aria-hidden`，有 `prefers-reduced-motion`，按钮使用原生 `<button>`。
- 未通过：源码没有 `:focus-visible` 规则，键盘焦点缺少项目级可见样式。
- 未通过：大量 9–11px 文字低于两个新 skill 建议的 12px/16px基线；尤其浅色三级字同时有尺寸与对比度问题。
- 风险：`.app{min-width:980px}` 且 `html,body{overflow:hidden}`，不满足 320px reflow；当前样张是固定 1200×960 风格门，不可据此声称响应式或 WCAG 合规。
- 风险：多个控制高度为 28px；适合紧凑桌面，但低于 `ui-audit` 建议的桌面 32px目标，也低于触控 44px。若 11 页包含触屏场景，必须另设触控规格。

这是一次方法与脚本的实测，不是完整 WCAG 认证：未进行 VoiceOver/NVDA、200% zoom、全键盘路径或自动 axe 扫描。

### 4.5 产品 UX 流程

将 `product-ux-workflow` 的四阶段套到现有材料：

| Workflow 阶段 | 本项目证据 | 结论 |
|---|---|---|
| 1 需求与场景 | `stage-2-requirements/` 的 FR/AC/M 编号 | 已有输入，后续页面必须继续追溯编号。 |
| 2 IA 与状态 | `stage-3-features/03-dialog-spec.md` 的四机制、七态 | 对话页覆盖较完整；其余 10 页仍需逐页核验全状态。 |
| 3 视觉系统 | `03-design-baseline.md` + 深/浅样张 | 已有基线；本轮发现浅色三级字、字号与焦点态缺口。 |
| 4 原型与交付 | 单文件 HTML + 四张 1200×960 截图 | 风格门已可运行；尚不是 11 页完整交互原型或开发交付包。 |

## 5. 能力边界与适用场景

| Skill | 能做什么 | 不能替代什么 |
|---|---|---|
| `product-prototype-design` | 从页面目标快速组织单文件 HTML、交互状态和演示数据。 | 不是需求真实性校验器；默认 CDN/目录不能凌驾于本项目零依赖与文件白名单；不自动保证安全、响应式或无障碍。 |
| `type-scale-generator` | 根据比例生成字号 token，公开原始值与取整逻辑。 | 不解决字体家族授权、中文字体实际渲染、行长和垂直节奏；不能靠公式替代 1200×960 实际排版。 |
| `color-system` | 建立语义 token、双主题映射和状态色职责。 | 内置调色板不是本项目事实来源；对比度仍须逐色对计算，渐变、透明度和图片背景需要另测。其印刷分支本项目暂不使用。 |
| `ui-audit` | 以稳定清单检查层级、视觉一致性、反馈、错误恢复、认知负荷和基本无障碍。 | 它是方法库，不会自动操作浏览器或输出像素差；也不能替代用户研究和业务验收。 |
| `web-accessibility` | 用脚本精确验证色对，并提供 WCAG 2.2 AA 的语义、焦点、动效检查框架。 | 自动化只能覆盖机械项；不能单独证明整个产品可访问，仍需键盘、读屏、缩放和真实用户测试。 |
| `product-ux-workflow` | 把需求、用户流、IA、线框、全状态、视觉和 handoff 串成门禁。 | 它不生成用户研究证据，也不替代 PRD/FR/AC；“必须先线框”等规则需结合本项目既有阶段成果，而非重复造文档。 |

## 6. 当前覆盖与仍缺环节

```text
FR/AC/M 与场景
  → product-ux-workflow（流程、IA、全状态、handoff）
  → minimalist-ui + type-scale-generator + color-system（视觉语言与 token）
  → ui-scanner + 大厂规范索引（外部参照，只作输入）
  → product-prototype-design（单文件交互原型）
  → ui-audit + web-accessibility（视觉/UX/WCAG 质量门）
  → chrome-headless-shell（真实渲染与截图）
```

已覆盖：需求到页面结构、双主题 token、字体/色彩、单文件高保真样张、异常恢复检查、色彩对比度和基础视觉 QA。

仍缺：

1. 真实用户研究与可用性测试；当前 skill 只能给方法，不能制造用户证据。
2. Figma 组件库和双向设计-代码同步；本项目当前以原生 HTML 样张为主，尚无必要引入 Figma connector。
3. 完整自动化无障碍流水线（axe/Lighthouse）、读屏、键盘、200% zoom、320px reflow。
4. 11 个页面的统一组件实现与跨页回归；目前只有对话样张完成风格门。
5. 图表页面的 ECharts 本地锁版、bundle 预算和表格回退实测。
6. 真实设备与浏览器矩阵；现有截图只证明固定 1200×960 的 chrome-headless-shell 结果。

## 7. 未装成功与拒装说明

- 没有“verify 通过但最终安装失败”的项；六项都已核对版本、落点和 origin 哈希。
- 所有 suspicious/fail 候选都保持未安装，包括重新验证仍失败的 `@aa-on-ai/design-review@1.1.0`。
- clean 但未安装的候选是主动去重或控制依赖面，不是安装失败。
- `skills-sh:` 的未扫描结果不满足 clean/pass 硬门槛，未尝试绕过 ClawHub 验证安装。

