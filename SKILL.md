---
name: wechat-vant-weapp
description: 针对原生微信小程序与 @vant/weapp 的项目内开发和设计稿转代码 skill。适用于新增或修改 pages 页面四件套、配置 usingComponents、接入 van- 组件、从 Figma 或 MasterGo 设计稿生成符合当前仓库规范的小程序代码，以及排查 Vant Weapp 组件注册、样式覆盖、Toast 使用和 style v2 冲突问题。默认遵循当前工作区中的 llm/ai-standards.md。
---

# WeChat Mini Program + Vant Weapp

本 skill 只服务当前工作区中的这个仓库，目标是让实现结果符合项目现有结构，而不是产出一份通用小程序脚手架。
目录遵循通用 Agent Skills 结构：`SKILL.md` 为入口，`references/` 提供按需阅读资料，`scripts/` 提供可执行辅助脚本。
文中的 `llm/ai-standards.md` 等路径，默认都指向当前工作区根目录下的项目路径，而不是相对 skill 目录计算。

## 何时使用

在以下任务中优先使用本 skill：

- 新增或修改微信小程序页面
- 接入、替换或调整 `@vant/weapp` 组件
- 新增页面级 `usingComponents` 或检查全局组件注册
- 根据设计稿生成或还原小程序页面
- 从 `Figma` 或 `MasterGo` 节点、页面、链接生成符合本仓库规范的代码
- 排查 Vant 组件不显示、样式异常、交互状态不生效

## 首轮动作
1. 优先做最小改动，沿用现有目录、命名、交互和视觉语言。
如果任务来自设计平台，先读 `references/design-to-code-platforms.md`，再继续实现。

## 必须遵守的项目约束

- 统一使用 CommonJS：`require()` 和 `module.exports`
- 页面目录固定为 `pages/<name>/`，保持 `.js`、`.json`、`.wxml`、`.wxss` 四件套
- 页面逻辑写在 `.js`，结构写在 `.wxml`，样式写在 `.wxss`，页面级配置写在 `.json`
- 页面状态放在 `data` 中，事件函数优先用 `handleXxx`
- 不在页面中写裸 `wx.request`；请求统一走 `utils/request.js`
- 小程序尺寸统一使用 `rpx`
- 保持当前浅色、卡片式、层级清晰的视觉语言

## Vant Weapp 工作方式

- 组件前缀固定为 `van-`
- 页面专属组件优先在页面 `.json` 的 `usingComponents` 中声明
- 真正全局复用的组件才放到 `app.json`
- 基础交互优先直接使用 Vant 标准组件，不要用普通 `view` 模拟按钮、输入框、复选框
- 调整组件样式时，优先把布局写在页面节点上，再通过 `custom-class`、`custom-style` 影响组件内部外观
- 不直接改 `@vant/weapp` 组件源码
- 图标优先使用 `van-icon`

遇到 Vant 显示或样式异常时，优先按这个顺序排查：

1. 组件是否已在当前页面 `.json` 或 `app.json` 注册
2. 是否忘了执行微信开发者工具中的“构建 npm”
3. 是否误开启了 `"style": "v2"`
4. 是否把布局样式错误地直接压到了组件内部节点上

## 实施流程

### 设计稿转代码

1. 先判断设计来源；当前环境里优先支持 `Figma` 和 `MasterGo`
2. 用对应平台工具读取节点、结构、变量、组件信息，不直接照搬平台生成代码
3. 先把设计元素映射成当前仓库可用的 `van-` 组件和页面结构
4. 再生成页面四件套、`usingComponents`、样式和必要交互
5. 若设计稿中的控件与 Vant 标准能力重合，优先使用 Vant，而不是还原成纯自定义结构
6. 对平台返回的参考代码，只把它当作视觉和结构线索，最终产物仍需符合本仓库规范

### 新平台输入

如果设计稿不是 `Figma` 或 `MasterGo`：

1. 优先让用户提供页面截图、标注、导出资源或结构说明
2. 仍按本 skill 的页面结构和 Vant 约束实现
3. 不要声称“所有设计平台都有原生工具支持”

### 新增或修改页面

1. 在 `pages/<name>/` 中维护四件套
2. 如果是新页面，同步更新 `app.json`
3. 需要 Vant 组件时，在页面 `.json` 声明 `usingComponents`
4. 结构尽量直接，少做过度封装


### 调整样式

1. 优先改页面 `.wxss`
2. 全局样式只保留基础通用能力
3. 命名采用接近 BEM 的方式
4. 避免为了复刻 Vant 外观而写一套自定义基础组件

## 交付前检查

- 运行 `npm run check:json`
- 新增页面时确认 `app.json` 已注册
- 新增 Vant 组件时确认对应 `usingComponents` 已声明
- 若依赖或组件有变化，提醒在微信开发者工具执行“构建 npm”
- 最好在微信开发者工具中确认编译通过

## 按需阅读的参考文件

- `references/design-to-code-platforms.md`
适合在根据 `Figma`、`MasterGo` 或其他设计平台输入生成小程序代码时阅读。

- `references/vant-patterns.md`
适合在处理页面组件注册、Toast、表单、按钮、布局与样式覆盖时阅读。

- `references/vant-components-docs.md`
适合在选择具体 `van-` 组件、寻找官方文档入口、判断子组件该看哪个父文档页时阅读。
如果发现这份索引过期或 Vant 版本变更，可运行 `node skills/wechat-vant-weapp/scripts/update_vant_components_docs.js` 重新生成。

- `references/page-checklist.md`
适合在新增页面、编辑页面做交付前自检时阅读。
