import { util } from 'zrender';
import type { RootProps } from '../type';
import type {
  RoamType,
  RoamOption,
  RoamControllerHost,
} from '../helper/RoamController';
import { Component } from './Component';

type ComponentOption = { type: string } | RootProps;

// https://s.thsi.cn/cd/iwc-datav-datav-front-web/components/rg/docs/
export type Option = {
  /**  初始化时进行自适应缩放平移 */
  adaptOnInit?: boolean;
  /** 自适应缩放时scale值范围 */
  adaptScaleRange?: [number, number];
  /** 上下与左右留白比例，默认 [0.1, 0.1]，即 10% */
  padding?: [number, number];
  /** 悬浮框工具提示 */
  tooltip?: {
    /** 悬浮框css样式 */
    style?: Partial<CSSStyleDeclaration>;
    /**
     * 自定义悬浮框内容渲染
     */
    formatter?: (
      props: ComponentOption | unknown,
      state?: unknown,
      target?: Component,
    ) => string;
  };
  /** 交互行为 */
  action?: {
    /** 缩放、平移交互 */
    roam?: {
      enable?: RoamType;
      /** 缩放灵敏度 */
      zoomSensitivity?: number;
      /** 缩放限制 */
      zoomLimit?: RoamControllerHost['zoomLimit'];
    } & RoamOption;
  };
  /** 全局的根节点配置 */
  root?: Omit<RootProps, 'type'>;
};

/**
 * 默认配置项生成器
 */
export function defaultOptionBuilder(): Partial<Option> {
  return {
    adaptOnInit: true,
    adaptScaleRange: [0, 100],
    padding: [0.1, 0.1],
    tooltip: {
      style: {},
      formatter: (props, state, target) => {
        return typeof target !== 'undefined'
          ? `[${target.type}]`
          : `[${props.type}] ${props.id}`;
      },
    },
    action: {
      roam: {
        enable: true,
      },
    },
  };
}

/**
 * 配置项管理
 */
export default class Model<Opt = Option> {
  protected _option: Opt;

  constructor(option: Partial<Opt>) {
    this._option = util.defaults(
      defaultOptionBuilder(),
      util.clone(option),
      true,
    ) as Opt;
  }

  getOption() {
    return this._option;
  }

  tooltipFormatter(...params: Parameters<Option['tooltip']['formatter']>) {
    const formatter = (this._option as Option)?.tooltip?.formatter;
    if (typeof formatter === 'function') {
      return formatter(...params);
    }

    return null;
  }
}
