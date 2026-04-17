# Vant Weapp Patterns

这份参考文件补充当前仓库里最常见的 `@vant/weapp` 使用方式。优先复用现有模式，不要把页面改成另一套组件风格。
文中的仓库路径默认都指向当前工作区根目录下的项目文件。

## 页面组件注册

页面专属组件优先写在页面 `.json`：

```json
{
  "usingComponents": {
    "van-button": "@vant/weapp/button/index",
    "van-field": "@vant/weapp/field/index",
    "van-cell-group": "@vant/weapp/cell-group/index"
  }
}
```

仅当多个页面都要稳定复用时，再考虑放到 `app.json`。

## 表单与按钮

优先使用 Vant 自带交互状态：

- `disabled`
- `loading`
- `loading-text`
- `block`
- `type`
- `maxlength`

不要用普通 `view` 模拟按钮、输入框、复选框。

如果页面需要输入手机号、验证码、确认勾选之类的基础交互，优先参考：

- `pages/index/index.wxml`
- `pages/index/index.js`

## Toast 模式

当前仓库已经在用 Vant Toast。常见写法如下：

```js
const Toast = require("@vant/weapp/toast/toast").default;

const TOAST_SELECTOR = "#van-toast";

Toast.success({
  message: "操作成功",
  selector: TOAST_SELECTOR
});
```

对应页面中需要有：

```xml
<van-toast id="van-toast" />
```

如果 Toast 没有弹出，优先检查：

1. 是否引入了 `@vant/weapp/toast/toast`
2. 是否声明了 `selector`
3. 页面里是否存在对应的 `id`

## 布局和外观分离

调整 Vant 样式时，优先区分：

- 布局：写在页面自己的 class 上
- 外观：通过 `custom-class` 或 `custom-style` 作用到组件内部

例如：

```xml
<van-button
  custom-class="login-page__button"
  block="{{true}}"
  loading="{{submitting}}"
  bind:click="handleLoginTap"
>
  登录
</van-button>
```

不要直接改组件源码，也不要把大量覆盖样式写到全局。

## 图标使用

图标优先使用 `van-icon` 内置名称。

只有在内置图标无法满足时，才考虑：

- `class-prefix`
- 字体图标

尽量不要为了一个小图标引入图片资源。

## 常见故障排查

### 组件不显示

- 检查页面 `.json` 的 `usingComponents`
- 检查 `npm install` 是否完成
- 检查微信开发者工具是否执行过“构建 npm”

### 样式看起来像原生组件

- 检查 `app.json` 是否误开启 `"style": "v2"`
- 检查是否把样式写到了错误层级
- 检查是否遗漏了 `custom-class`

### 行为状态不生效

- 优先用组件原生状态字段，不要手写同类视觉模拟
- 检查绑定事件名是否和 `.js` 中的方法一致
- 检查 `data` 中的状态字段是否有同步更新

## 请求与页面协作

页面只负责组织交互和展示。
