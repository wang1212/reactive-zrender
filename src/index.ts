import * as zrender from 'zrender';
import CanvasPainter from 'zrender/lib/canvas/Painter';
import './extension';

// ! 注册绘制器
zrender.registerPainter('canvas', CanvasPainter);

// apis
export { default as ReactiveZRender } from './core/ReactiveZRender';
export { getElementMetadata } from './core/element';
export { Component, defineComponent, findComponent } from './core/Component';
export {
  queryComponents,
  El,
  registerComponent,
  createRef,
} from './core/renderer';

// preset Components
export * from './component';

// util
export * as util from './util';

// helper
export * as helper from './helper';

// types
export * from './type';

// 3rd
export { zrender };
