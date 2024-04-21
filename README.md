# ReactiveZRender

![LICENSE](https://badgen.net/github/license/wang1212/reactive-zrender)
<!-- ![MINZIPPED SIZE](https://badgen.net/bundlephobia/minzip/@wang1212/reactive-zrender) -->
<!-- [![NPM VERSION](https://badgen.net/npm/v/@wang1212/reactive-zrender)](https://www.npmjs.com/package/@wang1212/reactive-zrender) -->
<!-- ![DOWNLOAD](https://badgen.net/npm/dt/@wang1212/reactive-zrender) -->
![LAST COMMIT](https://badgen.net/github/last-commit/wang1212/reactive-zrender)
<!-- ![GITHUB PACKAGE CI](https://img.shields.io/github/workflow/status/wang1212/reactive-zrender/Node.js%20Package?label=ci/package%20publish) -->
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/a9b9c06027ba47788617123cf84d3912)](https://www.codacy.com/gh/wang1212/reactive-zrender/dashboard?utm_source=github.com&utm_medium=referral&utm_content=wang1212/reactive-zrender&utm_campaign=Badge_Grade)

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

English | [简体中文](./README.zh-CN.md)

> Note: This is an experimental project!

A [zrender](http://ecomfe.github.io/zrender/)-based declarative design drawing library.

The build tool is based on [rollup](http://rollupjs.org/) and [typescript](https://www.typescriptlang.org/), among other tools.

## About

The goal of this project is to wrap a **declarative**, **component-based** drawing library based on [zrender](http://ecomfe.github.io/zrender/), borrowing design patterns from React and Vue.

Supports 2 component declaration modes:

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

- Class

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

The declared component should be known to the rendering engine, so the registration API needs to be called.

```typescript
const Group = RZRender.registerComponent(Group);
const Rect = RZRender.registerComponent(Rect);
```

Then, you can render declaratively by calling the `render()` api.

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

Yes, the code is ugly, and that's because there's no JSX, because JSX requires compiler support.

`render()` can be called multiple times, implementing a **React-like Diff mechanism**.

## Bundle

Run `npm run build`, the following bundles will eventually be generated.

```plain
types/
build/
├── bundle.esm.js
├── bundle.esm.min.js
├── bundle.umd.js
└── bundle.umd.min.js
```

Will also generate the corresponding **sourcemap** file.

## Development Guidelines

### Scripts

- Development mode

  ```bash
  npm run dev # or $ npm run esbuild-dev
  ```

- Development mode (web server)

  ```bash
  npm run dev-serve # or $ npm run esbuild-dev-serve
  ```

- Run test

  ```bash
  npm run test
  ```

- Build bundle

  ```bash
  npm run build
  ```

- Build Html documents from Markdown documents

  ```bash
  npm run build:docs-html
  ```

_See the `scripts` field in **package.json** for more commands._

### Git Commit Message Format

Adopt [community commit format best practices](https://www.conventionalcommits.org/):

```bash
# Before
git commit

# Now
npm run commit
```

_This constraint relies on tools [commitizen](http://commitizen.github.io/cz-cli/) and [commitlint](https://commitlint.js.org/) provided by the community._

### npm publish

The version management of this module adopts the specifications recommended by the community [Semantic Versioning](https://semver.org/). Follow version changes and maintain a **CHANGELOG.md**([Learn why](https://keepachangelog.com/)).

```bash
# Update version and generate changelog before publishing to npm repository
npm run release
# Or, preview
npm run release -- --dry-run

# Then publish to npm, if yes is not selected when auto-publishing to npm
npm publish # npm publish --access public
```

_These jobs are done with the help of [release-it](https://github.com/release-it/release-it) tool provided by the community._

## License

[MIT](./LICENSE).
