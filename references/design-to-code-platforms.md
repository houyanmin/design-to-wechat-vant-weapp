# Design To Code Platforms

这份参考文件用于把设计稿输入稳定地转成当前仓库的微信小程序代码。

目标不是复制设计平台原始代码，而是把设计稿转换成：

- `pages/<name>/` 四件套
- 符合 `llm/ai-standards.md` 的目录和分层
- 优先使用 `@vant/weapp` 的组件组合
- 可以在当前仓库里继续维护的代码

## 适用范围

当前环境里有明确工具支持的平台：

- `Figma`
- `MasterGo`

其他设计平台不是不能做，但通常需要用户额外提供：

- 页面截图
- 标注尺寸
- 切图或图标资源
- 结构说明

不要把“可根据设计稿写代码”和“所有设计平台都已原生接入”混为一谈。

## 通用转换原则

无论设计稿来自哪个平台，都遵循下面的顺序：

1. 先识别页面结构、区块层级和交互控件
2. 再判断哪些适合直接映射到 `van-` 组件
3. 再补页面专属结构、样式和最小业务逻辑
4. 输出仍然必须是小程序页面四件套，而不是平台原始导出代码

### 组件映射优先级

优先映射到这些标准能力：

- 按钮：`van-button`
- 输入框：`van-field`
- 单元格/列表项：`van-cell`、`van-cell-group`
- 复选/单选：`van-checkbox`、`van-radio`
- 弹层：`van-popup`、`van-dialog`、`van-action-sheet`
- 标签/提示：`van-tag`、`van-notice-bar`、`van-toast`
- 导航：`van-nav-bar`、`van-tabbar`、`van-tabs`

如果设计稿控件和 Vant 能力高度重合，优先复用 Vant，而不是造一套新的基础组件。

### 不要直接照搬的平台产物

不要直接把以下内容当最终代码：

- Figma 返回的参考代码
- MasterGo 返回的 HTML 片段
- 设计平台里的绝对定位结构
- 和当前仓库不一致的 React / Vue / HTML 代码

这些产物只能作为：

- 视觉层级参考
- 间距与排版参考
- 资源导出线索
- 结构拆分参考

## Figma 工作流

适用输入：

- Figma 设计文件 URL
- 带 `node-id` 的节点链接
- 指定页面或组件节点

优先流程：

1. 用 `get_design_context` 获取节点截图、结构上下文和参考代码
2. 如需查看节点树，再用 `get_metadata`
3. 如需变量或设计 token，再用 `get_variable_defs`
4. 如果任务和组件映射强相关，可用 `get_code_connect_map` 或 `get_code_connect_suggestions`

### Figma 转当前仓库代码时的约束

- 默认把 Figma 代码当参考，不直接落地
- 先按当前页面拆成 `.wxml`、`.wxss`、`.js`、`.json`
- 组件注册放到页面 `.json`
- 结构尽量简化，不把设计稿中的每一层 Frame 都翻译成一层 `view`
- 标准控件优先改写为 `Vant Weapp`

### Figma 适合补看的文件

- `references/vant-components-docs.md`
- `references/vant-patterns.md`
- `references/page-checklist.md`

## MasterGo 工作流

适用输入：

- `shortLink`
- `fileId + layerId`
- `contentId + documentId`

优先流程：

1. 页面或组件结构分析优先用 `getDsl`
2. 如果是整站或整页配置，优先用 `getMeta`
3. 如果 `getDsl` 返回 `componentDocumentLinks`，按顺序继续用 `getComponentLink`
4. 如果用户已经提供 D2C 的 `contentId`，再用 `getD2c`
5. 如果用户明确提到 `Generator`，再调用 `getComponentGenerator`

### MasterGo 转当前仓库代码时的约束

- `getDsl` 和 `getMeta` 返回的规则优先级高
- `getD2c` 落地的 HTML 不能直接作为小程序最终代码
- 要把布局和组件重新翻译为微信小程序结构与 `Vant Weapp`
- 业务交互仍按当前仓库的 `services/`、`utils/request.js`、`config/` 分层实现

## 输出要求

设计稿转代码的最终产物仍应满足：

- 页面目录落在 `pages/<name>/`
- 页面有四件套
- 使用 CommonJS
- 组件前缀保持 `van-`
- 小程序尺寸统一使用 `rpx`
- 样式语言保持当前仓库风格
- 请求逻辑不直接写裸 `wx.request`

## 平台选择建议

| 输入类型 | 优先策略 |
| --- | --- |
| Figma 节点链接 | 先走 Figma 工具链 |
| MasterGo 短链或 `fileId/layerId` | 先走 MasterGo 工具链 |
| 纯截图 | 手动结构化还原 |
| 平台生成的 HTML | 只作为参考，不直接落地 |
| 复杂表单页 | 先做 Vant 组件映射，再补细节样式 |

## 最终检查

设计稿转代码完成后，至少检查：

- 页面结构是否过度嵌套
- 是否遗漏页面 `.json` 的 `usingComponents`
- 是否把标准控件错误实现成普通 `view`
- 是否把平台导出的绝对定位样式原样保留过多
- 是否运行了 `npm run check:json`
