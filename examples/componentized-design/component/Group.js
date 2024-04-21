import * as RZRender from '../../../build/bundle.esm.js';

// * ------------------- 以 JSON 对象格式定义组件

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
      // * 对子元素进行坐标偏移处理
      children: children.map((child, index) => {
        return {
          ...child,
          props: {
            ...(child?.props || {}),
            opts: {
              ...(child?.props?.opts || {}),
              x: (child.props?.opts?.x || 0) + offset(index),
            },
          },
        };
      }),
    };
  },
});

export default RZRender.registerComponent(Group);
