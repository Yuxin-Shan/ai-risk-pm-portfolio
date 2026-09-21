# 阶段 4 设计工具链调研

> 项目边界：本项目是个人作品集 Demo，全部业务场景与数字均为虚构模拟。工具选型只服务于可点击 HTML 演示，不代表真实生产技术栈。
>
> 调研日期：2026-09-17。体积为当日对固定 CDN 文件的本地实测，`gzip` 是对下载文件重新 gzip 后的近似传输体积；实际 CDN 可能使用 Brotli，按需模块的总量会随组件而变。

## 1. 选型判定

采用 **原生 HTML/CSS/JS + CSS 设计 Token** 作为不可替代的底座，按需配三类外部能力：

- **Shoelace 2.20.1**：只在复杂浮层控件中使用，如 dialog、drawer、dropdown、tooltip；不接管页面视觉。
- **Lucide 1.47.0**：图标来源，最终只内联实际使用的 SVG，不加载整包。
- **Apache ECharts 6.1.0**：只在实时监控、实验对比、验证报告页面按需加载。

样张本身采用零外部运行依赖，保证双击 HTML 即可打开与截图。全量原型若使用 CDN，必须固定版本；最终交付可把所用资产 vendoring 到 `prototype/vendor/`，避免断网时不可演示。

## 2. 候选对比

| 方案 | 无构建直接 HTML | 实测体积 | 依赖方式 | 判断 |
|---|---:|---:|---|---|
| 原生 HTML/CSS/JS + Token | 是 | 0 KB 外部依赖 | 内联或本地 CSS/JS | **主底座**。最利于单文件、离线和精确品牌控制 |
| Shoelace 2.20.1 | 是 | light.css 19.5 KB / gzip 4.3 KB；dark.css 19.4 KB / gzip 4.2 KB；autoloader 1.5 KB / gzip 0.7 KB，另有按需组件模块 | jsDelivr ESM autoloader 或逐组件 ESM | **按需采用**。Web Components、原生框架无关、可懒加载；需要覆盖默认视觉并处理模块请求 |
| Lucide 1.47.0 | 是 | UMD 全包 442.4 KB / gzip 105.3 KB | CDN UMD、ESM，或单图标内联 SVG | **采用图标源，不加载全包**。线性图标统一、可继承颜色；按图标内联最适合原型 |
| ECharts 6.1.0 | 是 | 完整 min.js 1,121.9 KB / gzip 369.3 KB | CDN script；构建环境可按 core/charts/components tree-shake | **图表页按需采用**。图表能力完整，但不应进入对话页首屏 |
| Bootstrap 5.3.8 | 是 | CSS 232.1 KB / gzip 31.1 KB；bundle JS 80.5 KB / gzip 23.8 KB | jsDelivr CSS + bundle JS（含 Popper） | **不作主方案**。稳健且零构建，但默认视觉容易落入通用管理后台，需要大量反覆盖 |
| Tailwind Browser 4.x | 是，但官方定位为浏览器运行时 | browser script 281.8 KB / gzip 71.2 KB | CDN script，浏览器内生成样式 | **不采用**。原型可用但运行时和 class 噪声都不划算；本项目更需要稳定设计 Token |
| Ant Design / React 类库 | 否（常规用法） | 依赖构建产物与所选组件，单文件体积不固定 | npm + React + bundler | **排除**。会引入与本轮目标无关的构建链和框架状态管理 |

## 3. 公开 CDN 与版本锁定

推荐写法如下；全量原型只在实际需要对应能力的页面引入。

```html
<!-- Shoelace：按需浮层组件 -->
<link rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/themes/light.css">
<script type="module"
  src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/shoelace-autoloader.js"></script>

<!-- ECharts：仅图表页 -->
<script src="https://cdn.jsdelivr.net/npm/echarts@6.1.0/dist/echarts.min.js"></script>
```

Lucide 不建议按上面的整包方式加载。项目只取确实使用的图标 SVG，统一设为 `20 × 20`、`stroke-width="1.8"`、`aria-hidden="true"`；有语义的图标由相邻文字或 `aria-label` 说明。

## 4. 为什么不用一个大而全的组件库

1. 这是作品集原型，最高优先级是“讲得清楚、点得下去”，不是验证复杂前端工程栈。
2. 14 个冻结界面需要统一状态语义，但页面形态跨度很大；Token 比单一组件库更能统一它们。
3. 对话操作台是项目差异点，大型后台库的默认 Chat/Card/Table 组合会让它看起来像模板拼装。
4. 原生控件 + 少量 Web Components 能保留键盘可用性，也便于控制单文件与离线演示。

## 5. 组件实现分工

| 类型 | 实现方式 | 备注 |
|---|---|---|
| 导航、卡片、状态徽标、计划步骤、对象列表 | 原生 HTML + 项目 CSS | 视觉核心，必须自行控制层级与密度 |
| 输入框、按钮、单选、表格 | 原生语义控件 + 项目 CSS | 保留 focus、disabled、checked 等浏览器语义 |
| Dialog / Drawer / Dropdown / Tooltip | Shoelace 按需 | 复杂焦点管理交给成熟组件；主题由 Token 覆盖 |
| 图标 | Lucide 单图标内联 SVG | 禁止 emoji 作为功能图标；避免整包 |
| 趋势、分布、对比图 | ECharts 按页面加载 | 图上必须注明“模拟数据”，同时提供数值表或 tooltip |
| 页面路由与交互状态 | 原生 JS | 使用 `data-view` / `data-state`，不引入框架 |

## 6. 可靠性与许可

- CDN 资源必须锁定精确版本，不用 `@latest`；正式交付前记录 SHA/来源，必要时下载本地副本。
- 任何 CDN 失败都不能阻止核心导航、文字、按钮和状态展示；图表可降级为数据表。
- Shoelace 使用 MIT，Lucide 使用 ISC，ECharts 使用 Apache-2.0；交付包中保留第三方许可说明。
- 示例业务数据、案件号、对象号全部使用自造模拟值，不从参照产品或真实组织复制。

## 7. 官方资料

- [Shoelace installation](https://shoelace.style/getting-started/installation)：官方给出 CDN autoloader、传统 loader、按组件引入与 light/dark theme。
- [Lucide for Vanilla JavaScript](https://lucide.dev/guide/packages/lucide)：支持无框架 HTML、动态 SVG 与 tree-shaking。
- [ECharts import](https://echarts.apache.org/handbook/en/basics/import/)：官方建议按需引入 core/charts/components/renderer 以缩小 bundle。
- [Bootstrap quick start](https://getbootstrap.com/docs/5.3/getting-started/introduction/)：官方给出无需构建的 CDN CSS 与 bundle JS，并建议锁定完整性哈希。

## 8. 本轮样张实现说明

`../prototype/sample-dialog.html` 采用一个 HTML 文件、内联 CSS 与原生 JS，通过 `?theme=dark` / `?theme=light` 或页面右上角按钮切换。它不依赖网络，便于评审直接打开，也用于证明最终观感不会受阶段 3 低保真线框限制。
