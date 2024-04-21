import * as zrender from 'zrender';

export type { EventDefinition } from './core/ReactiveZRender';
export type { Option } from './core/Model';
export type { ElementSpec, ElementProps } from './core/element';
export type { default as Root, Props as RootProps } from './component/Root';

/**
 * 图表底层库 zRender 配置
 * @see https://ecomfe.github.io/zrender-doc/public/api.html#zrenderdisplayable
 */
export type RenderOption = {
  /** 中心坐标 */
  position: [number, number];
  /** 缩放 */
  scale: [number, number];
  /** 节点拖拽交互 */
  draggable: boolean;
  shape: { [key: string]: unknown };
  style: { [key: string]: unknown };
  /** 层级 */
  z: number;
  /** 忽略视图渲染但响应事件（仅对非 Group 类型元素生效） */
  invisible: boolean;
  /** 忽略视图渲染 */
  ignore: boolean;
};

/**
 * 图表动画 zRender 配置
 * @see https://ecomfe.github.io/zrender-doc/public/api.html#zrenderanimatableanimatepath-loop
 */
export type AnimationOption = Pick<
  zrender.ElementAnimateConfig,
  'easing' | 'delay' | 'during' | 'done' | 'aborted'
> & {
  /** 关键帧数组 */
  when: {
    /**
     * 缓动效果
     * @see https://ecomfe.github.io/zrender-doc/public/api.html#zrenderanimatorstarteasing
     *  */
    easing?: zrender.ElementAnimateConfig['easing'];
    time: number;
    value: RenderOption;
    /** 第三方 lottie 动画 */
    lottie?: {
      key: string;
      file?: string;
      data?: { [k: string]: unknown };
      action:
        | 'play'
        | 'goToAndPlay'
        | 'pause'
        | 'stop'
        | 'goToAndStop'
        | 'destroy';
    }[];
    /** 沿贝塞尔曲线运动 */
    moveAlongTheCurve?: {
      key: string;
      point1: [number, number];
      point2: [number, number];
      cpoint: [number, number];
      percent: number;
    };
  }[];
};
