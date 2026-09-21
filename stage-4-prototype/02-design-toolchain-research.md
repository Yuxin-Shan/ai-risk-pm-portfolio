# 阶段 4 设计工具链调研

> 调研日期：2026-09-17  
> 目标：无需构建即可打开可点击 HTML，并能在后续扩展到 14 个冻结界面。  
> 体积口径：2026-09-17 从 jsDelivr 实测的单次资源体积；`raw` 为下载原文，`transfer` 为 `curl --compressed` 传输量。CDN 版本更新、缓存与协商压缩会使数值变化。  
> 项目属性：个人作品集；原型中的业务数据均为虚构模拟。

## 1. 推荐组合

**主方案：原生 HTML + 设计 token CSS + 少量原生 JavaScript + Lucide Static 单图标 + ECharts 按页加载。**

原因：

- 双击 HTML 或通过任意静态服务器即可运行，不需要 Node 构建；
- 视觉可以完全受控，不会被通用后台模板反向塑形；
- 交互规模是作品集 Demo，原生事件与少量状态管理足够；
- 图标按 SVG 单个引入或内嵌，截图时无异步图标闪烁；
- 只有监控/报告页面需要图表，ECharts 不应进入对话窗口首屏。

## 2. 候选与取舍

| 方案 | 直接 HTML | 2026-09-17 实测体积 | 依赖方式 | 结论 |
|---|---:|---:|---|---|
| 自定义 token CSS + 原生 JS | 是 | 随页面；样张内联 | 页面内 `<style>` / `<script>`，最终可拆共享文件 | **采用**：最能控制高密度工作台的层级与两套主题 |
| Pico.css v2 | 是 | 83,319 B raw / 11,741 B transfer | `https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css` | **辅助候选**：表单、按钮、语义 HTML 起点好；复杂布局仍需自定义 CSS |
| Lucide Static 单 SVG | 是 | 本轮图标约 361–467 B raw / 个 | `https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/{name}.svg` | **采用**：单色线性风格、框架无关；样张从 CDN 实拉后内嵌路径 |
| Lucide UMD 全包 | 是 | 439,465 B raw / 103,502 B transfer | `https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.min.js` | 不作为默认：为了十几个图标加载全包不划算 |
| Apache ECharts 5 全包 | 是 | 1,034,102 B raw / 336,173 B transfer | `https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js` | **按需采用**：只在监控、实验、报告页加载；后续可定制裁剪 |
| Tailwind Play CDN 4 | 是 | 281,817 B raw / 71,349 B transfer | `https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4` | 不采用为主方案：官方明确仅供开发，且运行时生成样式；可用于一次性草图 |
| Shoelace 2.20.1 | 是 | 主题 4,272 B transfer；autoloader 719 B transfer，组件另按需加载 | light/dark CSS + ES module autoloader | 不采用：官方已标注进入 sunset 并建议迁移，新增依赖不利于长寿命样张 |

## 3. 各工具的适用边界

### 3.1 Pico.css：只做基础语义层，不做品牌层

Pico 官方支持 CDN、无 JavaScript 依赖、响应式 light/dark，并提供 130+ CSS 变量。它适合保证表单、按钮、表格的基础可用性，但其默认排版偏内容页，不能直接承担本项目紧凑三栏工作台。

**策略：** 后续若引入，只限定在表单控件与可访问性基线；布局、状态标签、执行卡、trace、对象栏仍由项目 token 控制。两版样张为确保完全自包含，未加载 Pico。

来源：[Pico CSS Quick Start](https://picocss.com/docs)、[Pico CSS Variables](https://picocss.com/docs/css-variables)

### 3.2 Lucide：静态 SVG 优先

Lucide Static 官方提供单个 SVG、sprite、icon font 与 SVG string，适合无框架静态应用。样张使用本轮从 CDN 实际下载的 `bot`、`activity`、`flask-conical`、`database`、`pause-circle`、`external-link`、`circle-check` 路径，未凭记忆手写。

**策略：** 常用导航图标可在最终原型中做本地 sprite；页面少量独有图标直接内嵌。装饰性图标设 `aria-hidden="true"`，有动作含义的图标必须有文字或 `aria-label`。

来源：[Lucide Static](https://lucide.dev/guide/static)、[Lucide Vanilla JS](https://lucide.dev/guide/lucide)

### 3.3 ECharts：图表页面按需加载

ECharts 官方支持 jsDelivr、unpkg、cdnjs 和自定义裁剪。全包压缩传输仍约 328 KiB，且对话主界面无需图表。

**策略：** 仅实时监控、实验对比、验证报告加载；首次进入对应页面再创建实例。图表颜色从同一组设计 token 读取，tooltip、legend、axis 不自成一套视觉系统。

来源：[ECharts Get Started](https://echarts.apache.org/handbook/en/get-started/)、[ECharts Download](https://echarts.apache.org/handbook/en/basics/download/)

### 3.4 Tailwind Play CDN：允许快速试色，不进入定稿

Tailwind 官方说明 Play CDN 无需构建，但仅用于开发，不面向生产。本项目虽然是 Demo，仍需要源码清晰、离线可复验和截图稳定，因此不让运行时编译器成为正式依赖。

来源：[Tailwind Play CDN](https://tailwindcss.com/docs/installation/play-cdn)

### 3.5 Shoelace：能力合适，但生命周期信号不合适

Shoelace 可通过 CDN 使用 Web Components，支持主题、自定义与可访问性；但其官网已说明项目进入 sunset，推荐迁移到 Web Awesome。对一个即将铺开 14 个界面的新原型，没有必要在第一天引入迁移负担。

来源：[Shoelace](https://shoelace.style/)

## 4. 推荐依赖清单

| 层 | 选型 | 加载策略 |
|---|---|---|
| 结构 | 原生语义 HTML | 本地文件，无运行时依赖 |
| 视觉 | CSS custom properties + grid/flex | 先内联样张；风格选定后拆为共享 `tokens.css` 与组件 CSS |
| 交互 | 原生 JavaScript | 事件委托；用 `data-state` 管理演示状态，不引入框架 |
| 图标 | Lucide Static | CDN 拉取后内嵌/本地 sprite；不依赖图标字体 |
| 图表 | ECharts | 只在需要的页面 CDN 按需加载；提供静态 fallback 文本 |
| 字体 | 系统中文字体栈 | `-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif`；避免字体 CDN 阻塞截图 |

## 5. 可打开与可复验策略

- 每个样张都是自包含 HTML，断网仍能打开；
- 最终原型可使用 `prototype/index.html` + 少量共享 CSS/JS，不引入构建产物；
- 外链脚本固定主版本，避免 `latest` 漂移；
- 截图使用本机 Puppeteer 随附 Chrome 152，固定视口 1200×960；
- 所有关键状态在 DOM 中有文字，不把含义只画进 canvas；
- 外部 CDN 不可达时，核心流程仍可点击，图表区域显示数据表或静态占位。

## 6. 风险与处理

| 风险 | 处理 |
|---|---|
| 双击 `file://` 时模块跨域限制 | 主交互不用 ES module；若使用外部模块，提供本地静态服务器说明 |
| CDN 失效或地区网络波动 | 核心 CSS/JS 本地化；图标内嵌；ECharts 提供表格 fallback |
| 单 HTML 逐步膨胀 | 风格选定后再拆共享 token 和组件，不在样张阶段过早工程化 |
| 两套主题产生两套结构 | 两版必须共享相同内容、信息层级与组件语义，只改视觉 token |
| 组件库默认样式显得模板化 | Pico 仅作基础控件，品牌表达由自定义 token 和局部组件完成 |

## 7. 授权与来源说明

- Lucide：ISC License；样张使用从 `lucide-static` 官方包 CDN 拉取的 SVG path。
- Apache ECharts：Apache License 2.0。
- Pico.css：MIT License。
- Shoelace：MIT License，仅作为备选调研，未用于样张。
- 字体：使用操作系统字体，不随项目分发字体文件。
