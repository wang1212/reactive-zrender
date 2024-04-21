/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-use-before-define */
import * as zrender from 'zrender';
import type ReactiveZRender from './ReactiveZRender';
import { enableClassManagement } from '../helper/clazz';
import type { ElementSpec } from './element';

type ComponentElementMetadata<
  P = unknown,
  S = unknown,
  E extends zrender.Element | zrender.Group = zrender.Element,
> = {
  ref: Component<P, S, E>;
};

type ComponentElement<
  P = unknown,
  S = unknown,
  E extends zrender.Element | zrender.Group = zrender.Element,
> = E & {
  __$$component: ComponentElementMetadata<P, S, E>;
};

export function isComponentType(type: string) {
  return type.slice(0, 1).toUpperCase() + type.slice(1) === type;
}

function isComponentElement<
  P = unknown,
  S = unknown,
  E extends zrender.Element | zrender.Group = zrender.Element,
>(el: E) {
  return typeof (el as ComponentElement<P, S, E>).__$$component !== 'undefined';
}

export function bindComponent<
  C extends Component,
  P = C['props'],
  S = C['state'],
  E extends zrender.Element | zrender.Group = C['el'],
>(el: E, component: C) {
  if (isComponentElement(el as ComponentElement<P, S, E>)) {
    throw new Error('The element is already a component.');
  }

  // eslint-disable-next-line no-param-reassign
  (el as ComponentElement<P, S, E>).__$$component = {
    // @ts-ignore
    ref: component,
  };

  // eslint-disable-next-line no-param-reassign
  component.el = el;
}

export function unbindComponent<
  C extends Component,
  P = C['props'],
  S = C['state'],
  E extends zrender.Element | zrender.Group = C['el'],
>(el: E, component: C) {
  if (!isComponentElement(el as ComponentElement<P, S, E>)) {
    throw new Error('The element is not a component.');
  }

  // eslint-disable-next-line no-param-reassign
  delete (el as ComponentElement<P, S, E>).__$$component;

  // eslint-disable-next-line no-param-reassign
  component.el = null;
}

/**
 * 从当前元素开始向上查找最近的组件实例
 */
export function findComponent<
  P = unknown,
  S = unknown,
  E extends zrender.Element | zrender.Group = zrender.Element,
>(el: E, findParent = true) {
  let comp: undefined | ComponentElementMetadata<P, S, E>;
  if (!el) {
    return comp;
  }

  if (isComponentElement(el as ComponentElement<P, S, E>)) {
    comp = (el as ComponentElement<P, S, E>).__$$component;
  } else if (findParent) {
    comp = findComponent<P, S, zrender.Group>(
      el.parent,
      findParent,
    ) as unknown as ComponentElementMetadata<P, S, E>;
  }

  return comp;
}

/**
 * @see https://projects.wojtekmaj.pl/react-lifecycle-methods-diagram/
 * @see https://vuejs.org/guide/essentials/lifecycle.html
 *
 * - CREATE: onBeforeMount() -》 render()  -》 onMounted()
 * - UPDATE: onBeforeUpdate() -》 render() -》 onUpdated()
 * - DELETE: onBeforeUnMount() -》destroy()
 */
export class Component<
  Props = unknown,
  State = unknown,
  Element extends zrender.Element | zrender.Group = zrender.Element,
> {
  static type = 'Component';

  type = Component.type;

  el: Element extends zrender.Group ? zrender.Group : zrender.Element;

  api: ReactiveZRender;

  props: Props;

  /** 组件内部状态 */
  state: State;

  /** 是否触发 tooltip */
  triggerTooltip = false;

  constructor(props?: Props) {
    this.props = props;
  }

  onBeforeMount(props: Props) {}

  onMounted(props: Props) {}

  onBeforeUpdate(props: Props, prevProps: Props) {}

  onUpdated(props: Props) {}

  render(props: Props, children: ElementSpec[] = []): ElementSpec {
    throw new Error("Please implement the 'render' logic.");
  }

  onBeforeUnMount() {}

  update() {}
}

export type JSONComponent<
  P = unknown,
  S = unknown,
  E extends zrender.Element | zrender.Group = zrender.Element,
> = Pick<
  Component<P, S, E>,
  | 'type'
  | 'triggerTooltip'
  | 'onBeforeMount'
  | 'render'
  | 'onMounted'
  | 'onBeforeUpdate'
  | 'onUpdated'
  | 'onBeforeUnMount'
>;

const ComponentManager = enableClassManagement(Component);
const jsonComponentsStorage = new Map<string, () => JSONComponent>();

export function defineComponent<
  P = unknown,
  S = unknown,
  E extends zrender.Element | zrender.Group = zrender.Element,
>(component: JSONComponent<P, S, E>) {
  return component;
}

export function registerComponent<
  P = unknown,
  S = unknown,
  E extends zrender.Element | zrender.Group = zrender.Element,
  C extends
    | typeof Component<P, S, E>
    | JSONComponent<P, S, E> = typeof Component<P, S, E>,
>(component: C) {
  if (typeof component === 'function') {
    ComponentManager.registerClass(component);
  } else {
    const { type } = component;

    if (typeof type === 'undefined') {
      throw new Error(`'type' should be specified.`);
    }

    if (jsonComponentsStorage.has(type)) {
      console.warn(
        `Component type '${type}' has already been registered, will override.`,
      );
    }

    jsonComponentsStorage.set(type, () => component);
  }
}

export function createComponent(type: string, props: unknown) {
  if (ComponentManager.hasClass(type)) {
    const Clazz = ComponentManager.getClass(type, true);

    return new Clazz(props) as Component;
  }

  if (jsonComponentsStorage.has(type)) {
    const component = new Component(props);
    const {
      triggerTooltip = false,
      onBeforeMount = component.onBeforeMount.bind(component),
      render = component.render.bind(component),
      onMounted = component.onMounted.bind(component),
      onBeforeUpdate = component.onBeforeUpdate.bind(component),
      onUpdated = component.onUpdated.bind(component),
      onBeforeUnMount = component.onBeforeUnMount.bind(component),
    } = jsonComponentsStorage.get(type)();

    return {
      ...component,
      type,
      triggerTooltip,
      onBeforeMount,
      render,
      onMounted,
      onBeforeUpdate,
      onUpdated,
      onBeforeUnMount,
    } as Component;
  }

  throw new Error(`Component type '${type}' is not registered.`);
}
