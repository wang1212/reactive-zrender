/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-use-before-define */
import * as zrender from 'zrender';
import type ReactiveZRender from './ReactiveZRender';
import {
  type ElementSpec,
  type ElementProps,
  createElement,
  updateElement,
  removeElement,
} from './element';
import {
  type Component,
  type JSONComponent,
  registerComponent as registerComponentFunc,
  isComponentType,
  createComponent,
  bindComponent,
  unbindComponent,
  findComponent,
} from './Component';

type ElementSpecCache<
  E extends zrender.Element | zrender.Group = zrender.Element,
> = ElementSpec & {
  __$$el: E;
  __$$component: Component<unknown, unknown, E>;
  __$$componentRendered: ElementSpecCache<E>;
};

/**
 * 缓存规范树，进行 diff 操作
 */
const specCacheMapStorage = new WeakMap<ReactiveZRender, ElementSpecCache>();

/**
 * 缓存与实例相关的所有组件实时引用
 */
const componentMapStorage = new WeakMap<
  ReactiveZRender,
  Map<Component['type'], Component[]>
>();

export function queryComponents<
  P = unknown,
  S = unknown,
  E extends zrender.Element | zrender.Group = zrender.Element,
>(
  api: ReactiveZRender,
  type: Component<P, S, E>['type'],
  filter: (component: Component<P, S, E>) => boolean = () => true,
) {
  const components = (componentMapStorage.get(api)?.get(type) ||
    []) as Component<P, S, E>[];

  return components.filter((component) => filter(component));
}

export function El<P = unknown>(
  type: string,
  props?: P,
  children?: ElementSpec[],
): ElementSpec<P> {
  return { type, props, children };
}

export function registerComponent<
  P = unknown,
  S = unknown,
  E extends zrender.Element | zrender.Group = zrender.Element,
  C extends
    | typeof Component<P, S, E>
    | JSONComponent<P, S, E> = typeof Component<P, S, E>,
>(component: C) {
  registerComponentFunc(component);

  return (props?: P, children: ElementSpec[] = []) =>
    El(component.type, props, children);
}

export function createRef() {
  return { value: null } as ElementProps['ref'];
}

function removeComponentElement<E extends zrender.Element = zrender.Element>(
  el: E,
) {
  const component = findComponent(el, false).ref;

  component.onBeforeUnMount();
  component.api = null;

  unbindComponent(el, component);
  removeElement(el);
}

function renderElement<
  E extends zrender.Element | zrender.Group = zrender.Element,
>(
  spec: ElementSpec,
  activeSpec: ElementSpecCache<E>,
  mountPoint: zrender.Group,
  api: ReactiveZRender,
) {
  let el: E;

  if (activeSpec) {
    if (spec.type === activeSpec.type) {
      // * DIFF:UPDATE
      el = activeSpec.__$$el;

      updateElement(el, spec.props, api);
    } else {
      // * DIFF:REPLACE
      unmount(activeSpec.__$$el);

      activeSpec = null;
    }
  }

  // * DIFF:ADD
  if (!el) {
    el = createElement<E>(spec.type, spec.props, api);
    mountPoint.add(el);
  }

  if (typeof spec?.props?.ref !== 'undefined') {
    spec.props.ref.value = el;
  }

  if (spec?.children?.length > 0) {
    if (!(el instanceof zrender.Group)) {
      throw new Error("Only element 'type = group' can have children.");
    }

    spec.children.forEach((childSpec, index) =>
      renderSpec<E>(
        childSpec,
        activeSpec?.children?.[index] as ElementSpecCache<E>,
        el as zrender.Group,
        api,
      ),
    );
  }

  // * DIFF:REMOVE
  if (activeSpec) {
    activeSpec?.children
      ?.slice(spec?.children?.length)
      .forEach((childSpec: ElementSpecCache<E>) => unmount(childSpec.__$$el));
  }

  return el;
}

function renderComponent<
  E extends zrender.Element | zrender.Group = zrender.Element,
>(
  spec: ElementSpec,
  activeSpec: ElementSpecCache<E>,
  mountPoint: zrender.Group,
  api: ReactiveZRender,
) {
  let component: Component;

  if (activeSpec) {
    if (spec.type === activeSpec.type) {
      // * DIFF:UPDATE
      component = activeSpec.__$$component;
    } else {
      // * DIFF:REPLACE
      unmount(activeSpec.__$$el);

      activeSpec = null;
    }
  }

  // * DIFF:ADD
  if (!component) {
    component = createComponent(spec.type, spec.props);
  }

  if (!activeSpec) {
    component.api = api;
    component.onBeforeMount(component.props);
  } else {
    component.onBeforeUpdate(spec.props, component.props);
    component.props = spec.props;
  }

  const toRenderSpec = component.render(component.props, spec.children);
  const el = renderSpec<E>(
    toRenderSpec,
    activeSpec?.__$$componentRendered,
    mountPoint,
    api,
  );

  if (!activeSpec) {
    bindComponent(el, component);
    component.onMounted(component.props);
  } else {
    component.onUpdated(component.props);
  }

  if (spec !== activeSpec) {
    componentMapStorage
      .get(api)
      .set(spec.type, [
        ...(componentMapStorage.get(api).get(spec.type) || []),
        component,
      ]);
  }

  // * DIFF
  (spec as ElementSpecCache<E>).__$$component = component;
  (spec as ElementSpecCache<E>).__$$componentRendered =
    toRenderSpec as ElementSpecCache<E>;

  // trigger update
  component.update = function () {
    renderComponent(spec, spec as ElementSpecCache<E>, mountPoint, api);
  };

  return el;
}

function renderSpec<
  E extends zrender.Element | zrender.Group = zrender.Element,
>(
  spec: ElementSpec,
  activeSpec: ElementSpecCache<E>,
  mountPoint: zrender.Group,
  api: ReactiveZRender,
) {
  let el: E;

  if (isComponentType(spec.type)) {
    el = renderComponent<E>(spec, activeSpec, mountPoint, api);
  } else {
    el = renderElement<E>(spec, activeSpec, mountPoint, api);
  }

  (spec as ElementSpecCache<E>).__$$el = el;

  return el;
}

export function render<
  E extends zrender.Element | zrender.Group = zrender.Element,
>(
  spec: ElementSpec,
  mountPoint: zrender.Group,
  api: ReactiveZRender,
  isLegacy = false,
) {
  const activeSpec = specCacheMapStorage.get(api);

  if (!isLegacy) {
    specCacheMapStorage.set(api, spec as ElementSpecCache<E>);
  }
  componentMapStorage.set(api, new Map());

  return renderSpec<E>(
    spec,
    activeSpec as ElementSpecCache<E>,
    mountPoint,
    api,
  );
}

export function unmount<
  E extends zrender.Element | zrender.Group = zrender.Element,
>(el: E) {
  if ((el as unknown as zrender.Group)?.isGroup) {
    (el as unknown as zrender.Group)
      .children()
      .slice()
      .forEach((child) => {
        unmount(child);
      });
  }

  if (findComponent(el, false)) {
    removeComponentElement(el);
  } else {
    removeElement(el);
  }
}
