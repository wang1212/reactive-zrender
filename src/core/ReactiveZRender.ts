import * as zrender from 'zrender';
import Eventful from 'zrender/lib/core/Eventful';
import type Clip from 'zrender/lib/animation/Clip';
import Model, { type Option } from './Model';
import Action, { type ActionDefinition } from './Action';
import Tooltip from '../ui/Tooltip';
import { debug } from '../helper/debug';
import { filterUndefinedValueProps } from '../util/data';
import * as roamHelper from '../helper/roamHelper';
import RoamController, { RoamControllerHost } from '../helper/RoamController';
import {
  updateLottieDom,
  elementGroupAnimationAction,
} from '../helper/animation';
import { parsePercent } from '../util/math';
import { type ElementSpec } from './element';
import { Component, findComponent } from './Component';
import { render, unmount } from './renderer';
// eslint-disable-next-line import/no-named-default
import { default as Root, Root as RootComponent } from '../component/Root';

const DEFAULT_ANIMATION_TIME = 200;

type CustomMouseEvent<T> = {
  type: T;
  zrEvent: zrender.ElementEvent;
  /** 全局坐标 */
  x: number;
  /** 全局坐标 */
  y: number;
  /** 触发事件的组件 */
  target?: Component;
};

/** 事件定义 */
export type EventDefinition = {
  /** 画布大小变化事件 */
  ['resize']: (event: { type: 'resize' }) => void;
  /** 平移事件 */
  ['pan']: (event: { type: 'pan'; dx: number; dy: number }) => void;
  /** 缩放事件 */
  ['zoom']: (event: {
    type: 'zoom';
    zoom: number;
    originEvent?: unknown;
  }) => void;
  ['click']: (event: CustomMouseEvent<'click'>) => void;
  ['mousedown']: (event: CustomMouseEvent<'mousedown'>) => void;
  ['mouseup']: (event: CustomMouseEvent<'mouseup'>) => void;
  ['mousemove']: (event: CustomMouseEvent<'mousemove'>) => void;
  ['mouseout']: (event: CustomMouseEvent<'mouseout'>) => void;
  ['mouseover']: (event: CustomMouseEvent<'mouseover'>) => void;
};

class ReactiveZRender extends Eventful<EventDefinition> {
  protected _dom: string;

  protected _model: Model;

  protected _action!: Action;

  protected _width!: number;

  protected _height!: number;

  /** zrender 实例 */
  private __zr!: zrender.ZRenderType;

  protected _group!: zrender.Group;

  /** 漫游控制器 */
  private __roamController!: RoamController;

  private __roamControllerHost!: RoamControllerHost;

  /** 原始 Transform 参数 */
  private __originTransform!: zrender.Element['transform'];

  private __originTransformNeedUpdate = false;

  // UI ------------------------
  private __tooltip!: Tooltip;
  // ------------------------ UI

  root!: RootComponent;

  /** 自定义动画 */
  private __customAnimations: {
    /** lottie 动画  */
    lottie: {
      [key: string]: {
        /** 是否要保持住，在节点销毁时不销毁 */
        keep: boolean;
        /** 唯一标识 */
        key: string;
        /** lottie 实例 */
        instance: unknown;
        /** dom 容器 */
        dom: HTMLElement;
        /** 关联的 zrender 元素 */
        zrElem: zrender.Element;
      };
    };
  };

  /** 数据更新动画是否播放中 */
  private __isUpdateAnimationPlaying = false;

  constructor(idSelector: string, option: Partial<Option> = {}) {
    super();

    this._dom = idSelector;
    this._model = new Model(option);

    this.__customAnimations = { lottie: {} };

    this._initialize();
  }

  getDom() {
    return this._dom;
  }

  getZr() {
    return this.__zr;
  }

  getOption() {
    return this._model.getOption();
  }

  getModel() {
    return this._model;
  }

  protected _initialize() {
    debug('before initialize');
    const domEl = document.getElementById(this._dom)!;

    this.__zr = zrender.init(domEl);
    this._width = this.__zr.getWidth();
    this._height = this.__zr.getHeight();

    this._group = render(
      Root() as ElementSpec,
      this.__zr as unknown as zrender.Group,
      this,
      true,
    );
    this.root = findComponent(this._group, false)!
      .ref as unknown as RootComponent;

    this._action = new Action();

    // 漫游控制
    this.__roamController = new RoamController(this.__zr);
    this.__roamControllerHost = {
      target: this.root.getEl(),
      zoom: 1,
    } as RoamControllerHost;

    this.__tooltip = new Tooltip(domEl, this);

    this.__bindEvents();

    // 默认的视图状态
    this.root.getEl().updateTransform();
    this.__originTransform = [];
    zrender.matrix.copy(
      this.__originTransform,
      this.root.getEl().transform || zrender.matrix.create(),
    );

    if (this._model.getOption().adaptOnInit) {
      this.__originTransformNeedUpdate = true;
      this.adapt();
    }

    debug('after initialize');
  }

  destroy() {
    this.clearAnimation();
    unmount(this.root.getEl());
    this.__roamController.disable();
    this.off();
    this._action.off();
    this.__tooltip.destroy();
    this.__zr.dispose();
  }

  private __bindEvents() {
    const self = this;

    self.__zr.on('click', (event) => {
      self.dispatchEvent('click', { zrEvent: event });
    });

    self.__zr.on('mousedown', (event) => {
      self.dispatchEvent('mousedown', { zrEvent: event });
    });

    self.__zr.on('mouseup', (event) => {
      self.dispatchEvent('mouseup', { zrEvent: event });
    });

    self.__zr.on('mousemove', (event) => {
      self.dispatchEvent('mousemove', { zrEvent: event });

      if (typeof event.target === 'undefined') {
        return;
      }

      // * tooltip
      const component =
        findComponent(event.target)?.ref ||
        findComponentLegacy(event.target)?.ref;
      if (component && component.triggerTooltip) {
        const content = !(component as { isLegacy: boolean }).isLegacy
          ? self
              .getModel()
              .tooltipFormatter(component.props, component.state, component)
          : self.getModel().tooltipFormatter(component.getOption());

        self.dispatchAction({
          type: 'showTooltip',
          x: event.offsetX,
          y: event.offsetY,
          content,
        });
      }
    });

    self.__zr.on('mouseout', (event) => {
      self.dispatchEvent('mouseout', { zrEvent: event });

      // * tooltip
      self.dispatchAction({ type: 'hideTooltip' });
    });

    self.__zr.on('mouseover', (event) => {
      self.dispatchEvent('mouseover', { zrEvent: event });
    });

    self.__updateRoamController();

    self.__zr.animation.on('frame', self.__onFrame.bind(self));
  }

  /**
   * 漫游控制
   * @see https://github.com/apache/echarts/blob/5.3.3/src/chart/tree/TreeView.ts#L275
   */
  private __updateRoamController() {
    const self = this;
    const globalOption = self.getOption();
    const {
      enable,
      zoomSensitivity = 1,
      zoomLimit,
      ...opt
    } = globalOption?.action?.roam || {};
    const controller = self.__roamController;
    const controllerHost = self.__roamControllerHost;

    controllerHost.zoomLimit = zoomLimit;

    controller.setPointerChecker(() => true);
    controller.enable(enable, opt);

    controller
      .off('pan')
      .off('zoom')
      .on('pan', (e) => {
        roamHelper.updateViewOnPan(controllerHost, e.dx, e.dy);
        self.dispatchEvent('pan', { dx: e.dx, dy: e.dy });
      })
      .on('zoom', (e) => {
        const zoomDelta = 1 + (e.scale - 1) * zoomSensitivity;

        roamHelper.updateViewOnZoom(
          controllerHost,
          zoomDelta,
          e.originX,
          e.originY,
        );
        self.dispatchEvent('zoom', { zoom: self.getZoom(), originEvent: e });
      });
  }

  private __onFrame() {
    Object.values(this.__customAnimations.lottie).forEach((item) => {
      updateLottieDom(item, true);
    });
  }

  /**
   * 根据图形规范进行渲染
   */
  render(graphicSpec: ReturnType<typeof Root>) {
    if (!graphicSpec) {
      return;
    }

    render(graphicSpec as ElementSpec, this.root.getEl(), this);
  }

  /**
   * 自适应缩放平移，根据 option 中的 padding 将图缩放到中心
   */
  // eslint-disable-next-line complexity, sonarjs/cognitive-complexity
  adapt(
    option?: {
      bBox?:
        | zrender.Element
        | zrender.Group
        | zrender.BoundingRect
        | 'all'
        | 'node'
        | 'edge';
      offset?: [number, number];
    },
    animation: boolean | zrender.ElementAnimateConfig = false,
  ) {
    this.__resize();

    const rootGroup = this.root.getEl();
    rootGroup.stopAnimation(null, true);
    rootGroup.updateTransform();
    rootGroup.decomposeTransform();

    // * 中心的基准
    let bBox = option?.bBox as zrender.BoundingRect;
    let el: zrender.Element | zrender.Group;

    if (bBox instanceof zrender.Element || bBox instanceof zrender.Group) {
      el = bBox;
    } else if (typeof option?.bBox === 'undefined' || option?.bBox === 'all') {
      el = rootGroup;
    }

    if (el) {
      if (el === rootGroup && rootGroup.children().length > 2) {
        // !legacy
        bBox = rootGroup
          .getBoundingRect(
            rootGroup
              .children()
              .slice()
              .filter(
                (child) =>
                  ![this.nodeSet.getEl(), this.edgeSet.getEl()].includes(child),
              ),
          )
          .clone();
      } else {
        bBox = el.getBoundingRect().clone();
      }
      bBox.applyTransform(el.transform);

      // * 将缩放元素从根元素的逆矩阵中恢复，因为后续计算都是基于根元素处于初始状态（即 x = y = 0, scale = 1）
      bBox.applyTransform(rootGroup.invTransform);
    }

    // ! 空视图
    if (bBox.width === 0 || bBox.height === 0) {
      return;
    }

    const globalOption = this._model.getOption();
    // * 图形中心 + 偏移
    const offset = option?.offset || [0, 0];
    const groupCenter = [
      bBox.x + bBox.width / 2 + (offset[0] || 0),
      bBox.y + bBox.height / 2 + (offset[1] || 0),
    ];
    // 视区中心
    const viewCenter = [this._width / 2, this._height / 2];
    // * 根据宽高比使得内容充满容器
    let scale =
      bBox.width / bBox.height < this._width / this._height
        ? this._height / bBox.height
        : this._width / bBox.width;

    if (typeof globalOption?.adaptScaleRange !== 'undefined') {
      scale = Math.max(
        Math.min(scale, globalOption.adaptScaleRange[1]),
        globalOption.adaptScaleRange[0],
      );
    }

    let [scaleX, scaleY] = [scale, scale];
    if (typeof globalOption?.padding !== 'undefined') {
      [scaleX, scaleY] = [
        scaleX * (1 - globalOption.padding[1]),
        scaleY * (1 - globalOption.padding[0]),
      ];
    }

    // 将图形中心与画布中心对齐，进行偏移调整
    let [x, y] = [
      viewCenter[0] - groupCenter[0],
      viewCenter[1] - groupCenter[1],
    ];
    const [zoomX, zoomY] = viewCenter;
    const [zoomScaleX, zoomScaleY] = [scaleX, scaleY];

    // ! 将缩放中心的变化换算为坐标偏移（两个缩放中心之间的差值）
    x -= (zoomX - x) * (zoomScaleX - 1);
    y -= (zoomY - y) * (zoomScaleY - 1);

    this.__transformTo(
      {
        position: [x, y],
        // 缩放
        scale: [zoomScaleX, zoomScaleY] as [number, number],
      },
      animation,
    );

    // FIXME
    this.__roamControllerHost.zoom = 1;
    this.dispatchEvent('zoom', { zoom: this.__roamControllerHost.zoom });
  }

  move(
    offset: [number, number],
    animation: boolean | zrender.ElementAnimateConfig = false,
  ) {
    this.moveTo(
      [this._group.x + offset[0], this._group.y + offset[1]],
      animation,
    );
  }

  /**
   * 平移
   */
  moveTo(
    position: [number, number],
    animation: boolean | zrender.ElementAnimateConfig = false,
  ) {
    this.__transformTo(
      {
        position,
      },
      animation,
    );
  }

  getZoom() {
    return this.__roamControllerHost.zoom;
  }

  /**
   *
   * @example
   * ```typescript
   * // 以画布中心缩放到当前的 90%
   * chartIns.zoom(0.9);
   *
   * // 以画布的 (50%, 25%) 位置为缩放中心缩放到当前的 90%
   * chartIns.zoom({ zoomDelta: 0.9, zoomX: '50%', zoomY: '25%' });
   * ```
   */
  zoom<
    T extends number | { zoomDelta: number; zoomX?: number; zoomY?: number },
  >(zoomDelta: T, animation: boolean | zrender.ElementAnimateConfig = false) {
    let params = zoomDelta as Exclude<T, number> & { zoom: number };
    if (typeof zoomDelta === 'number') {
      params = { zoomDelta };
    }
    if (typeof params.zoomDelta !== 'number') {
      return;
    }

    params.zoom = this.getZoom() * params.zoomDelta;

    this.zoomTo(params, animation);
  }

  zoomTo<T extends number | { zoom: number; zoomX?: number; zoomY?: number }>(
    zoom: T,
    animation: boolean | zrender.ElementAnimateConfig = false,
  ) {
    let params = zoom as Exclude<T, number>;
    if (typeof zoom === 'number') {
      params = { zoom };
    }
    if (typeof params.zoom !== 'number' || params.zoom === this.getZoom()) {
      return;
    }

    const groupEl = this.root.getEl();
    const zoomScale = params.zoom / this.getZoom();
    const [zoomX, zoomY] = [
      parsePercent(params?.zoomX || '50%', this._width),
      parsePercent(params?.zoomY || '50%', this._height),
    ];
    let [x, y] = [groupEl.x, groupEl.y];

    // ! 将缩放中心的变化换算为坐标偏移
    x -= (zoomX - x) * (zoomScale - 1);
    y -= (zoomY - y) * (zoomScale - 1);

    this.__transformTo(
      {
        position: [x, y],
        scale: [groupEl.scaleX * zoomScale, groupEl.scaleY * zoomScale],
      },
      animation,
    );

    this.__roamControllerHost.zoom = params.zoom;

    this.dispatchEvent('zoom', { zoom: params.zoom });
  }

  getOriginViewProps() {
    const group = new zrender.Group();
    zrender.matrix.copy(
      group.transform || (group.transform = []),
      this.__originTransform,
    );
    group.invTransform = group.invTransform || [];
    zrender.matrix.invert(group.invTransform, group.transform);

    group.decomposeTransform();

    return {
      x: group.x,
      y: group.y,
      scaleX: group.scaleX,
      scaleY: group.scaleY,
    };
  }

  /**
   * 恢复到默认的视图状态
   * TODO 初始状态的获取
   */
  resetView(animation: boolean | zrender.ElementAnimateConfig = false) {
    const { x, y, scaleX, scaleY } = this.getOriginViewProps();

    this.__transformTo(
      {
        position: [x, y],
        scale: [scaleX, scaleY],
      },
      animation,
    );

    this.__roamControllerHost.zoom = 1;
  }

  /**
   * ! 不要直接调用，不会更新 zoom
   */
  private __transformTo(
    option: {
      position?: [number, number];
      scale?: [number, number];
    },
    animation: boolean | zrender.ElementAnimateConfig = false,
  ) {
    const self = this;
    const groupEl = self.root.getEl();
    let props = {
      x: option.position?.[0] ?? undefined,
      y: option.position?.[1] ?? undefined,
      scaleX: option.scale?.[0] ?? undefined,
      scaleY: option.scale?.[1] ?? undefined,
    };
    props = filterUndefinedValueProps(props);

    // 缓存初始状态
    function cacheOriginTransform() {
      if (self.__originTransformNeedUpdate) {
        const rect = groupEl.getBoundingRect();
        if (rect.width > 0 && rect.height > 0) {
          groupEl.updateTransform();

          self.__originTransform = [];
          zrender.matrix.copy(
            self.__originTransform,
            groupEl.transform || zrender.matrix.create(),
          );

          self.__originTransformNeedUpdate = false;
        }
      }
    }

    if (animation === false) {
      groupEl.attr(props);

      cacheOriginTransform();

      return self;
    }

    let animationOption = { duration: DEFAULT_ANIMATION_TIME } as Exclude<
      typeof animation,
      boolean
    >;
    if (typeof animation === 'object') {
      animationOption = { ...animationOption, ...animation };
    }
    const doneFunc = animationOption.done;
    animationOption.done = () => {
      cacheOriginTransform();
      doneFunc?.();
    };
    // 累积动画，允许对同一个 key 同时做多次动画而不被打断
    animationOption.additive = true;

    groupEl.animateTo(props, animationOption);

    return this;
  }

  /**
   * 清空动画（自定义动画）
   */
  clearAnimation() {
    Object.values(this.__customAnimations.lottie).forEach((lottieAnimData) => {
      lottieAnimData.instance.destroy();
      lottieAnimData.dom.remove();

      delete this.__customAnimations.lottie[lottieAnimData.key];
    });
  }

  /**
   * 数据更新动画播放状态
   */
  isUpdateAnimationPlaying() {
    return this.__isUpdateAnimationPlaying;
  }

  //
  private __resize() {
    this.__zr.flush();

    // 适应容器大小变化
    this.__zr.resize();
    this._width = this.__zr.getWidth();
    this._height = this.__zr.getHeight();
  }

  /**
   * 自适应
   */
  resize() {
    this.__resize();
    this.dispatchEvent('resize');
  }

  /**
   * 分发事件
   */
  dispatchEvent<E extends keyof EventDefinition>(
    eventName: E,
    eventInfo_: Partial<Parameters<EventDefinition[E]>[0]> = {},
  ) {
    const MOUSE_EVENTS = [
      'click',
      'mousedown',
      'mouseup',
      'mousemove',
      'mouseout',
      'mouseover',
    ] as const;
    type Ev = (typeof MOUSE_EVENTS)[number];

    const eventInfo = {
      type: eventName,
      ...eventInfo_,
    } as Parameters<EventDefinition[Ev]>[0];

    if (MOUSE_EVENTS.includes(eventName as unknown as Ev)) {
      eventInfo.x = eventInfo.x ?? eventInfo.zrEvent.offsetX;
      eventInfo.y = eventInfo.y ?? eventInfo.zrEvent.offsetY;
    }

    if (typeof eventInfo?.zrEvent?.target !== 'undefined') {
      const component =
        findComponent(eventInfo.zrEvent.target)?.ref ||
        findComponentLegacy(eventInfo.zrEvent.target)?.ref;

      eventInfo.target = component as Component;
    }

    debug('dispatchEvent: %s %o %o', eventName, eventInfo);
    this.trigger(eventName, ...([eventInfo] as Parameters<EventDefinition[E]>));
  }

  registerAction<A extends keyof ActionDefinition>(
    actionInfo: { type: A },
    cb: ActionDefinition[A],
  ) {
    // @ts-ignore
    this._action.on(actionInfo.type, cb, this);
  }

  dispatchAction<A extends keyof ActionDefinition>({
    type,
    ...payload
  }: Parameters<ActionDefinition[A]>[0] extends undefined
    ? { type: A }
    : { type: A } & Parameters<ActionDefinition[A]>[0]) {
    // @ts-ignore
    this._action.trigger(type, payload);
  }

  /**
   * 暂停元素动画
   */
  extendPauseAnimation() {
    /* eslint-disable */
    const chart = this;
    chart._isAnimationPlaying = false;

    elementGroupAnimationAction(chart._group, 'pause');

    Object.values(chart.__customAnimations.lottie).forEach((lottieAnimData) => {
      lottieAnimData.instance.pause();
    });
    /* eslint-enable */
  }

  /**
   * 恢复元素动画
   */
  extendResumeAnimation() {
    /* eslint-disable */
    const chart = this;
    let flag = false;

    if (!chart.getZr().animation.isFinished()) {
      flag = true;
    }

    elementGroupAnimationAction(chart._group, 'resume');

    Object.values(chart.__customAnimations.lottie).forEach((lottieAnimData) => {
      flag = true;
      lottieAnimData.instance.play();
    });

    if (flag) {
      chart.__isUpdateAnimationPlaying = true;
    }
    /* eslint-enable */
  }

  /**
   * 停止元素动画
   */
  extendStopAnimation(forwardToLast = false) {
    /* eslint-disable */
    const chart = this;
    chart.__isUpdateAnimationPlaying = false;

    elementGroupAnimationAction(chart._group, 'stop', '', forwardToLast);

    Object.values(chart.__customAnimations.lottie).forEach((lottieAnimData) => {
      // ! 不销毁，保持住
      if (lottieAnimData.keep) {
        lottieAnimData.zrElem = null;

        return;
      }

      lottieAnimData.instance.destroy();
      lottieAnimData.dom.remove();

      delete chart.__customAnimations.lottie[lottieAnimData.key];
    });
    /* eslint-enable */
  }

  /**
   * 开始元素动画
   */
  extendStartAnimation({
    easing = 'linear',
    onFrame,
    onDone,
  }: {
    easing?: string;
    onFrame?: (percent: number) => void;
    onDone?: (percent: number) => void;
  } = {}) {
    /* eslint-disable */
    const chart = this;

    elementGroupAnimationAction(chart._group, 'start', easing);

    // ! 没有动画就直接结束
    if (chart.getZr().animation.isFinished()) {
      chart.__isUpdateAnimationPlaying = false;

      // !必须异步调用，防止在没有动画的情况下播放一帧的时候判断错误导致连续播放
      setTimeout(() => {
        onDone(1);
      }, 1);

      return;
    }
    chart.__isUpdateAnimationPlaying = true;

    let maxLifeClip: Clip = null;
    const clips = [chart.getZr().animation._head] as (Clip & {
      __$originOnFrame?: Clip['onframe'];
      __$originOnDestroy?: Clip['ondestroy'];
    })[];
    while (clips[clips.length - 1]?.next) {
      clips.push(clips[clips.length - 1].next);
    }

    clips.forEach((clip) => {
      if (clip.__$originOnFrame) {
        clip.onframe = clip.__$originOnFrame;
        delete clip.__$originOnFrame;
      }
      if (clip.__$originOnDestroy) {
        clip.ondestroy = clip.__$originOnDestroy;
        delete clip.__$originOnDestroy;
      }

      if (!maxLifeClip || clip._life > maxLifeClip._life) {
        maxLifeClip = clip;
      }
    });

    if (!maxLifeClip) return;

    maxLifeClip.__$originOnFrame = maxLifeClip.onframe;
    maxLifeClip.onframe = (target, percent) => {
      maxLifeClip.__$originOnFrame(target, percent);
      onFrame?.(percent);
    };

    maxLifeClip.__$originOnDestroy = maxLifeClip.ondestroy;
    maxLifeClip.ondestroy = (...rest) => {
      chart.__isUpdateAnimationPlaying = false;

      maxLifeClip.__$originOnDestroy(...rest);
      onDone?.(1);
    };

    Object.values(chart.__customAnimations.lottie).forEach((lottieAnimData) => {
      lottieAnimData.instance.play();
    });
    /* eslint-enable */
  }
}

export default ReactiveZRender;
