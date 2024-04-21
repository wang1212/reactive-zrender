# ReactiveZRender

![LICENSE](https://badgen.net/github/license/wang1212/reactive-zrender)
<!-- ![MINZIPPED SIZE](https://badgen.net/bundlephobia/minzip/@wang1212/reactive-zrender) -->
<!-- [![NPM VERSION](https://badgen.net/npm/v/@wang1212/reactive-zrender)](https://www.npmjs.com/package/@wang1212/reactive-zrender) -->
<!-- ![DOWNLOAD](https://badgen.net/npm/dt/@wang1212/reactive-zrender) -->
![LAST COMMIT](https://badgen.net/github/last-commit/wang1212/reactive-zrender)
<!-- ![GITHUB PACKAGE CI](https://img.shields.io/github/workflow/status/wang1212/reactive-zrender/Node.js%20Package?label=ci/package%20publish) -->
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/a9b9c06027ba47788617123cf84d3912)](https://www.codacy.com/gh/wang1212/reactive-zrender/dashboard?utm_source=github.com&utm_medium=referral&utm_content=wang1212/reactive-zrender&utm_campaign=Badge_Grade)

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

[English](./README.md) | 简体中文

> 注意：这是一个实验性项目！

基于 [zrender](http://ecomfe.github.io/zrender/) 的声明式设计绘图库。

构建工具基于 [rollup](http://rollupjs.org/) 和 [typescript](https://www.typescriptlang.org/) 等工具。

## 关于

这个项目的目的是借鉴 React 和 Vue 的设计模式，基于 [zrender](http://ecomfe.github.io/zrender/) 封装一个**声明式**和**组件化**的绘图库。

支持 2 种组件声明模式：

- JSON

```typescript
const Group = RZRender.defineComponent({
  type: 'Group',
  render: function ({ x = 0, y = 0 } = {}, children) {
    const offset = (index) => 50 * index;

    return {
      type: 'group',
      props: {
        opts: {
          x,
          y,
        },
      },
      children,
    };
  },
});
```

- 类

```typescript
class Rect extends RZRender.Component {
  static type = 'Rect';
  type = Rect.type;

  triggerTooltip = true;

  handleClick() {
    alert('click rect');
  }

  handleMouseEnter() {
    this.state.backgroundColor = 'red';
    this.update();
  }

  handleMouseLeave(backgroundColor) {
    this.state.backgroundColor = backgroundColor;
    this.update();
  }

  render(
    {
      width = 10,
      height = 10,
      backgroundColor = 'black',
      animation,
      ...rest
    } = {},
    children,
  ) {
    console.log('render', this.state.backgroundColor);

    return {
      type: 'rect',
      props: {
        ref: this.state.ref,
        opts: {
          ...rest,
          shape: {
            width,
            height,
          },
          style: {
            text: '11',
            fill: this.state.backgroundColor,
          },
          onclick: () => this.handleClick(),
          onmouseover: () => this.handleMouseEnter(),
          onmouseout: () => this.handleMouseLeave(backgroundColor),
        },
        animation,
      },
      children,
    };
  }

  onBeforeMount(props) {
    // console.log('onBeforeMount', props);
    this.state = {
      ref: RZRender.createRef(),
      backgroundColor: props.backgroundColor || 'black',
    };
  }

  onMounted(props) {
    // console.log('onMounted', props);
    // console.log('state', this, this.state);
    // console.log(
    // 'metadata',
    // dynamicRelationGraphs.relationGraphs.getElementMetadata(this.state.ref.value)
    // );
  }

  onBeforeUpdate(props, prevProps) {
    // console.log('onBeforeUpdate', props, prevProps);
  }

  onUpdated(props) {
    // console.log('onUpdated', props);
  }

  onBeforeUnMount() {
    // console.log('onBeforeUnMount', this.props);
  }
}
```

声明的组件应该被渲染引擎了解，所以需要调用注册 API。

```typescript
const Group = RZRender.registerComponent(Group);
const Rect = RZRender.registerComponent(Rect);
```

然后，调用 `render()` API 即可以声明式的方式进行渲染。

```typescript
const canvas = new RZRender.ReactiveZRender($dom.id);

canvas.render(
  RZRender.Root(
    {
      opts: {
        x: 10,
        y: 100,
        scaleX: 2,
      },
      animation1: {
        when: [
          {
            time: 300,
            zoom: [2.5, true],
          },
          {
            time: 5e2,
            zoom: [0.8, true],
          },
        ],
      },
    },
    [
      {
        type: 'text',
        props: {
          opts: {
            style: {
              text: 'Hello',
            },
          },
        },
      },
      Rect({
        backgroundColor: 'red',
        animation: {
          when: [
            {
              time: 300,
              value: {
                x: 25,
              },
            },
            {
              time: 1e3,
              value: {
                x: 75,
              },
            },
          ],
        },
      }),
      Group(
        {
          x: 40,
          y: 40,
        },
        [
          // * 组件的子元素可以是其它组件，也可以是原生 zrender 元素
          // 原生 zenrder 元素
          {
            type: 'rect',
            props: {
              opts: {
                shape: {
                  width: 10,
                  height: 10,
                },
                style: {
                  fill: 'pink',
                },
                x: 100,
              },
            },
          },
          // 其它组件
          Rect({
            width: 30,
            height: 10,
            backgroundColor: 'orange',
          }),
        ],
      ),
      Rect({
        width: 30,
        height: 10,
        x: 100,
        y: 0,
        scaleX: 3,
      }),
    ],
  )
);
```

是的，代码很丑陋，这是因为没有 [JSX](https://legacy.reactjs.org/docs/introducing-jsx.html)，因为 JSX 需要编译器支持。

`render()` 可以多次调用，实现了**类似 React 的 Diff 机制**。

## 打包

运行 `npm run build`, 最终将生成以下捆绑包。

```plain
types/
build/
├── bundle.esm.js
├── bundle.esm.min.js
├── bundle.umd.js
└── bundle.umd.min.js
```

还将生成相应的 **sourcemap** 文件。

## 开发准则

### 脚本

- 开发模式

  ```bash
  npm run dev # or $ npm run esbuild-dev
  ```

- 开发模式（Web 服务）

  ```bash
  npm run dev-serve # or $ npm run esbuild-dev-serve
  ```

- 运行测试

  ```bash
  npm run test
  ```

- 构建打包

  ```bash
  npm run build
  ```

- 从 Markdown 文档构建 Html 文档

  ```bash
  npm run build:docs-html
  ```

_更多命令查看 **package.json** 中 `scripts` 字段。_

### Git 提交信息格式

采用[社区提交格式最佳实践](https://www.conventionalcommits.org/)：

```bash
# 以前
git commit

# 现在
npm run commit
```

_这种约束依赖于社区提供的工具 [commitizen](http://commitizen.github.io/cz-cli/) 和 [commitlint](https://commitlint.js.org/)。_

### npm 发布

该模块的版本管理采用社区推荐的规范[语义化版本控制](https://semver.org/)。跟随版本变动会维护一个**变更日志(CHANGELOG.md)**（[了解为什么这么做](https://keepachangelog.com/)）。

```bash
# 在发布到 npm 存储库之前更新版本并生成更改日志
npm run release
# 或者，进行预览
npm run release -- --dry-run

# 然后发布到 npm，如果在自动发布到 npm 时没有选择 yes
npm publish # npm publish --access public
```

_这些工作是在社区提供的 [release-it](https://github.com/release-it/release-it) 工具的帮助下完成的。_

## 许可

[MIT](./LICENSE).
