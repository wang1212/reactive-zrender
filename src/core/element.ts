/* eslint-disable no-param-reassign */
import * as zrender from 'zrender';
import type ReactiveZRender from './ReactiveZRender';
import type { AnimationOption } from '../type';
import { setElementAnimation } from '../helper/animation';

export interface ElementProps {
  /** 对绘图元素的引用 */
  ref?: { value?: zrender.Element | zrender.Group };
  /**
   * 元素初始化属性配置
   * @see https://ecomfe.github.io/zrender-doc/public/api.html#zrenderdisplayable
   */
  opts?: zrender.PathProps;
  animation?: AnimationOption;
}

export interface ElementSpec<Props = ElementProps> {
  /** 元素类型，首字母小写为 zrender 原生元素类型，首字母大写为自定义组件类型 */
  type: string;
  // 元素属性
  props?: Props;
  /** 子元素节点 */
  children?: ElementSpec[];
}

type ElementMetadata<P extends ElementProps = ElementProps> = Omit<
  ElementSpec<P>,
  'children'
>;

type Element<
  E extends zrender.Element | zrender.Group = zrender.Element,
  P extends ElementProps = ElementProps,
> = E & {
  __$$metadata: ElementMetadata<P>;
};

export function getElementMetadata<
  E extends zrender.Element | zrender.Group,
  P extends ElementProps = ElementProps,
>(el: E) {
  return (el as Element<E, P>).__$$metadata;
}

export function createElement<
  E extends zrender.Element | zrender.Group = zrender.Element,
  P extends ElementProps = ElementProps,
>(type: ElementSpec['type'], props: P, api: ReactiveZRender) {
  const className = type.slice(0, 1).toUpperCase() + type.slice(1);
  const Clazz = zrender[className] as typeof zrender.Element;
  if (typeof Clazz === 'undefined') {
    throw new Error(`Unsupported element type: ${type}`);
  }

  const el = new Clazz(props?.opts || {}) as E;

  if (typeof props?.animation !== 'undefined') {
    setElementAnimation(api, el, props.animation);
  }

  // * bind metadata
  (el as Element<E, P>).__$$metadata = {
    type,
    props,
  };

  return el;
}

export function updateElement<
  E extends zrender.Element | zrender.Group = zrender.Element,
  P extends ElementProps = ElementProps,
>(el: E, props: P, api: ReactiveZRender) {
  el.attr(props?.opts || {});

  if (typeof props?.animation !== 'undefined') {
    setElementAnimation(api, el, props.animation);
  }

  // * bind metadata
  (el as Element<E, P>).__$$metadata.props = props;

  return el;
}

export function removeElement<
  E extends zrender.Element | zrender.Group,
  P extends ElementProps = ElementProps,
>(el: E) {
  if ((el as unknown as zrender.Group)?.parent) {
    (el as unknown as zrender.Group).parent.remove(el);
  }

  // * unbind metadata
  // eslint-disable-next-line no-param-reassign
  delete (el as Element<E, P>).__$$metadata;
}
