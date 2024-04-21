import * as RZRender from '../../../build/bundle.esm.js';

// * ------------------- 以 Class 格式定义组件

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
        // * 2. 传递 ref 获取组件底层 zrender 元素实例的引用
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
    // * 1. 创建组件对底层 zrender 元素实例的引用
    this.state = {
      ref: RZRender.createRef(),
      backgroundColor: props.backgroundColor || 'black',
    };
  }

  onMounted(props) {
    // console.log('onMounted', props);
    // * 获取组件的状态信息
    // console.log('state', this, this.state);
    // * 获取元素相关的元信息
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

export default RZRender.registerComponent(Rect);
