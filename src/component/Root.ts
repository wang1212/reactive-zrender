import * as zrender from 'zrender';
import type { AnimationOption } from '../type';
import { type ElementSpec, type ElementProps } from '../core/element';
import { Component } from '../core/Component';
import { registerComponent } from '../core/renderer';
import type ReactiveZRender from '../core/ReactiveZRender';
import { generateUID as uid } from '../util/common';

// eslint-disable-next-line no-use-before-define
function setAnimation(
  el: zrender.Element,
  animation: Props['animation'],
  api: ReactiveZRender,
) {
  const animator = el
    .animate('', false, true)
    .delay(animation.delay ?? 0)
    .during(animation.during)
    .done(animation.done as () => void)
    .aborted(animation.aborted as () => void);

  if (typeof animation.easing !== 'undefined') {
    // ! 保存缓动函数，在调用 start() 时使用
    animator.__$easing = animation.easing;
  }

  // ! 采用临时属性，保证自定义动画的循环也能成功执行
  const tempKey = `__$$tempT_${uid()}__`;

  el[tempKey] = 0;

  animation?.when?.forEach((keyframe, index) => {
    const targetT = index + 1;

    animator.when(keyframe.time, { [tempKey]: targetT }, keyframe.easing);

    (['move', 'zoom', 'zoomTo'] as const)
      .map((key) => (keyframe[key] ? ([key, keyframe[key]] as const) : null))
      .filter(Boolean)
      .forEach(([action, args]) => {
        let flag = false;

        function invoke() {
          if (api.isUpdateAnimationPlaying()) {
            // @ts-ignore
            api[action](...args);
          } else {
            // @ts-ignore
            api[action](args[0], false);
          }
        }

        // ! time === 0 时作为初始化状态，动画无效
        if (keyframe.time === 0) {
          invoke();

          return;
        }

        animator.during(() => {
          if (flag || el[tempKey] < targetT) {
            return;
          }
          flag = true;

          invoke();
        });
      });
  });

  animator
    .aborted(() => {
      delete el[tempKey];
    })
    .done(() => {
      delete el[tempKey];
    });
}

export interface Props extends Omit<ElementProps, 'animation'> {
  /** 动画配置 */
  animation?: Omit<AnimationOption, 'when'> & {
    when: {
      easing?: zrender.ElementAnimateConfig['easing'];
      time: number;
      zoomTo?: Parameters<ReactiveZRender['zoomTo']>;
      zoom?: Parameters<ReactiveZRender['zoom']>;
      move?: Parameters<ReactiveZRender['move']>;
    }[];
  };
}

export class Root extends Component<Props, unknown, zrender.Group> {
  static readonly type = 'Root';

  readonly type = Root.type;

  render(props: Props = {}, children: ElementSpec[] = []): ElementSpec {
    const { animation, ...restProps } = props;

    return {
      type: 'group',
      props: restProps,
      children,
    };
  }

  onMounted(props: Props): void {
    if (typeof props?.animation !== 'undefined') {
      setAnimation(this.el, props.animation, this.api);
    }
  }

  /**
   * legacy api
   */
  getEl() {
    return this.el;
  }

  /**
   * legacy api
   */
  update(props: Props) {
    this.props = props;

    if (typeof props?.animation !== 'undefined') {
      setAnimation(this.el, props.animation, this.api);
    }
  }
}

export default registerComponent<Props>(Root);
