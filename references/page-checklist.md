# Page Checklist

在当前仓库里做微信小程序页面开发时，可按下面的清单自检。

## 新增页面

- 已创建 `pages/<name>/` 目录
- 已补齐 `<name>.js`、`<name>.json`、`<name>.wxml`、`<name>.wxss`
- 已在 `app.json` 注册页面路径
- 页面标题和页面级组件声明写在 `.json`
- 页面逻辑使用 CommonJS

## 新增 Vant 组件

- 组件名保持 `van-` 前缀
- 在当前页面 `.json` 的 `usingComponents` 中声明
- 只在确实全局复用时才放入 `app.json`
- 没有用普通 `view` 模拟 Vant 基础交互组件
- 若样式需要定制，优先用了 `custom-class` 或 `custom-style`


## 修改样式

- 尺寸统一使用 `rpx`
- 样式尽量写在页面 `.wxss`
- 全局样式没有被滥用
- 命名保持接近 BEM
- 视觉语言仍与现有页面一致

## 交付前验证

- 已运行 `npm run check:json`
- 新增页面已确认 `app.json` 注册
- 新增组件已确认 `usingComponents` 声明
- 如有依赖变化，已提醒执行微信开发者工具“构建 npm”
- 最好在微信开发者工具中完成一次编译或预览确认
