import * as zrender from 'zrender';
import type Element from 'zrender/lib/Element';
import type Animator from 'zrender/lib/animation/Animator';
import lottieWeb from 'lottie-web';
import type ReactiveZRender from '../core/ReactiveZRender';
import type { AnimationOption, Node, Edge } from '../type';
import { generateUID as uid } from '../util/common';
import { getPointOnQuadraticBezierCurve } from '../util/math';

/**
 * 设置原生动画的关键帧
 */
function setNativeAnimationFrame<E extends zrender.Element>(
  element: E,
  animator_: Animator<E>,
  frameOption: {
    easing: zrender.ElementAnimateConfig['easing'];
    time: number;
    propKey: string;
    propValue: { [key: string]: unknown };
  },
  option?: {
    // 是否 Node 节点
    isNode?: Node;
    // 是否 Edge 节点
    isEdge?: Edge;
  },
) {
  let animator = animator_;
  if (!animator) {
    if (option?.isNode && ['style', 'shape'].includes(frameOption.propKey)) {
      animator = (element as unknown as zrender.Group)
        .childAt(0)
        .animate(frameOption.propKey, false, true);
    } else {
      animator = element.animate(frameOption.propKey, false, true);
    }
  }

  animator.when(frameOption.time, frameOption.propValue, frameOption.easing);

  return animator;
}

function setNativeAnimationCallBack(
  relationGraphs: ReactiveZRender,
  element: zrender.Element,
  {
    key,
    animator,
    animation,
  }: {
    key: 0 | 'style' | 'shape';
    animator: unknown;
    animation: AnimationOption;
  },
  option?: {
    // 是否 Node 节点
    isNode?: Node;
    // 是否 Edge 节点
    isEdge?: Edge;
  },
) {
  // eslint-disable-next-line
  animator
    .during((props) => {
      if (option?.isNode) {
        if (
          zrender.util.isFunction(
            relationGraphs.getModel().getOption().nodes.customRender,
          )
        ) {
          // HACK 必须放在 frame 中，否则动画无法执行
          // requestAnimationFrame(() => {

          // });
          // * 自定义渲染
          relationGraphs
            .getModel()
            .getOption()
            .nodes.customRender(relationGraphs, option.isNode, {
              update: {
                isUpdateByAnimation: true,
                opts: key === 0 ? { ...props } : { [key]: props },
              },
            });
        }

        //
      }

      if (
        option?.isEdge &&
        typeof relationGraphs.getModel().getOption().edges.customRender ===
          'function'
      ) {
        // HACK 必须放在 frame 中，否则动画无法执行
        // requestAnimationFrame(() => {

        // });
        // * 自定义渲染
        relationGraphs
          .getModel()
          .getOption()
          .edges.customRender(relationGraphs, option.isEdge, {
            update: {
              isUpdateByAnimation: true,
              line:
                element.name === 'line'
                  ? key === 0
                    ? { ...props }
                    : { [key]: props }
                  : null,
              arrow:
                element.name === 'arrow'
                  ? key === 0
                    ? { ...props }
                    : { [key]: props }
                  : null,
            },
          });
      }

      //
    })
    .done(() => {
      // console.log(`node - ${key} - ${node._id}:`, 'animation completed!');
    });
  // .start();
}

/**
 * 设置原生支持的动画
 */
function setNativeAnimation<E extends zrender.Element>(
  relationGraphs: ReactiveZRender,
  element: E,
  animationOption: AnimationOption,
  option?: {
    // 是否 Node 节点
    isNode?: Node;
    // 是否 Edge 节点
    isEdge?: Edge;
  },
) {
  const animatorsMap: Record<0 | 'style' | 'shape', Animator<Element>> = {
    0: null,
    style: null,
    shape: null,
  };

  animationOption.when.forEach(
    ({ easing, time, value: { style, shape, ...rest } = {} }) => {
      // HACK 0 的状态已经更新
      // if (time === 0) {
      //   return;
      // }

      if (style && Object.keys(style).length) {
        animatorsMap.style = setNativeAnimationFrame(
          element,
          animatorsMap.style,
          {
            easing,
            time,
            propKey: 'style',
            propValue: style,
          },
          option,
        );
      }

      if (shape && Object.keys(shape).length) {
        animatorsMap.shape = setNativeAnimationFrame(
          element,
          animatorsMap.shape,
          {
            easing,
            time,
            propKey: 'shape',
            propValue: shape,
          },
          option,
        );
      }

      if (rest && Object.keys(rest).length) {
        animatorsMap[0] = setNativeAnimationFrame(
          element,
          animatorsMap[0],
          {
            easing,
            time,
            propKey: '',
            propValue: rest,
          },
          option,
        );
      }

      //
    },
  );

  const animators = Object.entries(animatorsMap).filter((item) => !!item[1]);

  animators.forEach(
    ([key, animator]: [string, ReturnType<zrender.Element['animate']>]) => {
      // TODO
      // if (typeof animationOption.duration !== 'undefined') {
      //   animator.duration(animationOption.duration);
      // }
      animator
        .delay(animationOption.delay ?? 0)
        .during(animationOption.during)
        .done(animationOption.done as () => void)
        .aborted(animationOption.aborted as () => void);

      if (typeof animationOption.easing !== 'undefined') {
        // ! 保存缓动函数，在调用 start() 时使用
        animator.__$easing = animationOption.easing;
      }

      setNativeAnimationCallBack(
        relationGraphs,
        element,
        { key, animator, animation: animationOption },
        option,
      );
    },
  );

  return animators.map((item) => item[1]);
}

/**
 * 更新 lottie dom 位置大小
 */
export function updateLottieDom(
  lottieAnimData: { dom: HTMLElement; zrElem: zrender.Element },
  onFrame = false,
) {
  if (!lottieAnimData?.zrElem || !lottieAnimData?.dom) {
    return;
  }

  // DEBUG
  // lottieAnimData.zrElem.childAt(0).attr({
  //   invisible: false,
  //   style: {
  //     opacity: 1,
  //     stroke: '#000'
  //   }
  // });

  if (onFrame) {
    const visible = !lottieAnimData.zrElem.ignore;
    lottieAnimData.dom.style.display = visible ? 'block' : 'none';

    return;
  }

  const bBox = lottieAnimData.zrElem.getBoundingRect().clone();
  bBox.applyTransform(lottieAnimData.zrElem.transform);

  lottieAnimData.dom.style = `position: absolute; left: ${bBox.x}px; top: ${bBox.y}px; width: ${bBox.width}px; height: ${bBox.height}px; pointer-events: none;`;
  if (lottieAnimData?.dom?.childNodes[0]) {
    lottieAnimData.dom.childNodes[0].style.display = 'block';
  }
}

/**
 * 设置自定义动画
 */
// eslint-disable-next-line sonarjs/cognitive-complexity, max-lines-per-function
function setCustomAnimation(
  relationGraphs: ReactiveZRender,
  element: zrender.Element,
  animationOption: AnimationOption,
  option?: {
    // 是否 Node 节点
    isNode?: Node;
    // 是否 Edge 节点
    isEdge?: Edge;
  },
) {
  // 这个要存在全局
  const lottieAnimMap = relationGraphs.__customAnimations.lottie;
  const storeMap: {
    key: string;
    animator: Animator<Element>;
    timeStep: { [key: string]: boolean };
    moveAlongTheCurveTimeRageMap: {
      [key: string]: { start: number; end: number };
    };
  } = {
    key: null,
    animator: null,
    timeStep: {},
    moveAlongTheCurveTimeRageMap: {},
  };

  /**
   * * 曲线运动处理
   */
  function updateMoveAlongTheCurve({
    props,
    moveAlongTheCurve,
    moveAlongTheCurveKey,
  }) {
    element.attr({
      position: getPointOnQuadraticBezierCurve(
        moveAlongTheCurve.point1,
        moveAlongTheCurve.point2,
        moveAlongTheCurve.cpoint,
        props[moveAlongTheCurveKey],
      ),
    });
  }

  /**
   * * lottie 动画
   * @see http://airbnb.io/lottie/#/web?id=usage
   */
  function updateLottie({ lottie, playing }) {
    // eslint-disable-next-line complexity
    lottie.forEach((lottieAnimationConfig) => {
      let lottieAnimData = lottieAnimMap[lottieAnimationConfig.key];
      if (!lottieAnimData || !lottieAnimData.zrElem) {
        if (!lottieAnimData) {
          lottieAnimData = {
            keep: !!lottieAnimationConfig.keep,
            key: lottieAnimationConfig.key,
            instance: null,
            dom: null,
            zrElem: element,
          };
        }
        // * 更新元素引用
        lottieAnimData.zrElem = element;

        // * 元素更新时，刷新 lottie 的 dom
        lottieAnimData.zrElem.afterUpdate = () => {
          updateLottieDom(lottieAnimData);
        };

        // ! 保存到元素上
        if (!element.__$$lottieKeys) {
          element.__$$lottieKeys = [lottieAnimationConfig.key];
        } else {
          element.__$$lottieKeys.push(lottieAnimationConfig.key);
        }
      }
      lottieAnimData.keep = !!lottieAnimationConfig.keep;

      if (
        lottieAnimationConfig.action === 'play' ||
        lottieAnimationConfig.action === 'goToAndPlay' ||
        lottieAnimationConfig.action === 'goToAndStop'
      ) {
        // eslint-disable-next-line no-inner-declarations, complexity
        function play() {
          if (!playing) {
            if (
              // ? 判断 play 只是为了保持对以前代码的兼容
              (lottieAnimationConfig.action === 'play' &&
                typeof lottieAnimationConfig.atTime !== 'undefined') ||
              lottieAnimationConfig.action === 'goToAndStop'
            ) {
              lottieAnimationConfig.atTime =
                typeof lottieAnimationConfig.atTime === 'undefined'
                  ? 0
                  : lottieAnimationConfig.atTime;
              lottieAnimData.instance.goToAndStop(
                lottieAnimationConfig.atTime,
                false,
              );
            }
            // ? 可能传进来 goToAndPlay，但判断与 playing 冲突，所以暂不处理

            return;
          }

          if (
            // ? 判断 play 只是为了保持对以前代码的兼容
            (lottieAnimationConfig.action === 'play' &&
              typeof lottieAnimationConfig.atTime !== 'undefined') ||
            lottieAnimationConfig.action === 'goToAndPlay'
          ) {
            lottieAnimationConfig.atTime =
              typeof lottieAnimationConfig.atTime === 'undefined'
                ? 0
                : lottieAnimationConfig.atTime;
            lottieAnimData.instance.goToAndPlay(
              lottieAnimationConfig.atTime,
              false,
            );
          } else if (lottieAnimationConfig.action === 'goToAndStop') {
            lottieAnimationConfig.atTime =
              typeof lottieAnimationConfig.atTime === 'undefined'
                ? 0
                : lottieAnimationConfig.atTime;
            lottieAnimData.instance.goToAndStop(
              lottieAnimationConfig.atTime,
              false,
            );
          } else if (lottieAnimationConfig.action === 'play') {
            lottieAnimData.instance.play();
          }
        }

        if (lottieAnimData.instance) {
          if (Array.isArray(lottieAnimData.instance.__$$pendingToOperate)) {
            lottieAnimData.instance.__$$pendingToOperate.push(() => {
              play();
            });
          } else {
            play();
          }

          return;
        }

        // ! 立即刷新
        relationGraphs.getZr().flush();

        const $el = document.createElement('div');
        $el.id = `_lottie-${lottieAnimationConfig.key}`;
        document.getElementById(relationGraphs.getDom()).appendChild($el);
        lottieAnimData.dom = $el;

        lottieAnimData.instance = lottieWeb.loadAnimation({
          container: $el,
          // renderer: 'canvas',
          loop: false,
          autoplay: false,
          animationData: lottieAnimationConfig.data || null,
          path: lottieAnimationConfig.file || null,
        });

        if (lottieAnimationConfig.file) {
          // HACK 收集调用，异步的初始加载完成后才调用
          lottieAnimData.instance.__$$pendingToOperate = [() => play()];
          // ! 对于网络文件，必须等待 dom 加载完成
          lottieAnimData.instance.addEventListener('DOMLoaded', (...args) => {
            if (Array.isArray(lottieAnimData.instance.__$$pendingToOperate)) {
              lottieAnimData.instance.__$$pendingToOperate.forEach((func) =>
                func(),
              );
            }
            lottieAnimData.instance.__$$pendingToOperate = null;
            updateLottieDom(lottieAnimData);
          });
        } else {
          play();
          requestAnimationFrame(() => {
            updateLottieDom(lottieAnimData);
          });
        }

        // *
        lottieAnimMap[lottieAnimData.key] = lottieAnimData;
      } else if (
        lottieAnimData.instance &&
        lottieAnimationConfig.action === 'pause'
      ) {
        if (Array.isArray(lottieAnimData.instance.__$$pendingToOperate)) {
          lottieAnimData.instance.__$$pendingToOperate.push(() => {
            lottieAnimData.instance.pause();
          });
        } else {
          lottieAnimData.instance.pause();
        }
      } else if (
        lottieAnimData.instance &&
        lottieAnimationConfig.action === 'stop'
      ) {
        if (Array.isArray(lottieAnimData.instance.__$$pendingToOperate)) {
          lottieAnimData.instance.__$$pendingToOperate.push(() => {
            if (lottieAnimationConfig.atTime !== undefined) {
              lottieAnimData.instance.goToAndStop(
                lottieAnimationConfig.atTime,
                false,
              );
            } else {
              lottieAnimData.instance.stop();
            }
          });
        } else {
          // eslint-disable-next-line no-lonely-if
          if (lottieAnimationConfig.atTime !== undefined) {
            lottieAnimData.instance.goToAndStop(
              lottieAnimationConfig.atTime,
              false,
            );
          } else {
            lottieAnimData.instance.stop();
          }
        }
      } else if (
        lottieAnimData.instance &&
        lottieAnimationConfig.action === 'destroy'
      ) {
        lottieAnimData.instance.__$$pendingToOperate = null;
        lottieAnimData.instance.destroy();
        lottieAnimData.dom.remove();

        // *
        delete lottieAnimMap[lottieAnimData.key];
      }
    });
  }

  // eslint-disable-next-line complexity
  animationOption.when.forEach(
    ({ easing, time, value, lottie, moveAlongTheCurve, ...others }) => {
      if (
        !lottie &&
        !moveAlongTheCurve &&
        (!others || !Object.keys(others).length)
      ) {
        return;
      }

      let { key } = storeMap;

      if (!key) {
        key = `__$$customAnimation_${uid()}__`;

        storeMap.key = key;
        storeMap.animator = element
          .animate('', false, true)
          .delay(animationOption.delay ?? 0)
          .during(animationOption.during)
          .done(animationOption.done as () => void)
          .aborted(animationOption.aborted as () => void);
        storeMap.animator._type = 'custom';

        element[key] = 0;
      }

      const props = { [key]: time };

      // 曲线运动处理
      let moveAlongTheCurveKey = null;
      if (moveAlongTheCurve) {
        const keyTemp = `__$$moveAlongTheCurve@${moveAlongTheCurve.key}__`;

        if (typeof element[keyTemp] === 'undefined') {
          element[keyTemp] = moveAlongTheCurve.percent;
          moveAlongTheCurveKey = keyTemp;
        }

        props[keyTemp] = moveAlongTheCurve.percent;

        if (
          typeof storeMap.moveAlongTheCurveTimeRageMap[
            moveAlongTheCurve.key
          ] === 'undefined'
        ) {
          storeMap.moveAlongTheCurveTimeRageMap[moveAlongTheCurve.key] = {
            start: time,
            end: time,
          };
        } else {
          storeMap.moveAlongTheCurveTimeRageMap[moveAlongTheCurve.key].end =
            time;
        }
      }

      /**
       * 帧更新
       */
      function onFrame(target: Element, percent: number, playing = true) {
        if (
          moveAlongTheCurve &&
          moveAlongTheCurveKey &&
          // * 边界条件判断
          target[key] >=
            storeMap.moveAlongTheCurveTimeRageMap[moveAlongTheCurve.key]
              .start &&
          target[key] <=
            storeMap.moveAlongTheCurveTimeRageMap[moveAlongTheCurve.key].end
        ) {
          updateMoveAlongTheCurve({
            props: target,
            moveAlongTheCurve,
            moveAlongTheCurveKey,
          });
        }

        // * 边界条件判断：离散动画，仅在时间点触发一次
        if (target[key] < time || storeMap.timeStep[time]) {
          return;
        }
        storeMap.timeStep[time] = true;

        if (lottie) {
          updateLottie({ lottie, playing });
        }
      }

      storeMap.animator
        .when(time, props, easing)
        .during((target, percent) => onFrame(target, percent));

      // HACK 初始状态 lottie
      if (time === 0) {
        // FIXME
        onFrame(props, 0, false);
      }

      if (typeof animationOption.easing !== 'undefined') {
        // ! 保存缓动函数，在调用 start() 时使用
        storeMap.animator.__$easing = animationOption.easing;
      }
    },
  );

  return storeMap.animator ? [storeMap.animator] : [];
}

/**
 * 元素的动画操作
 */
export function elementAnimationAction(
  element: zrender.Element,
  action: 'start' | 'pause' | 'resume' | 'stop',
  ...args
) {
  if (action === 'stop') {
    // * 必须对动画按总时长进行排序，避免在直接 stop 动画时，动画时长短的比动画时长长的后执行，出现动画的终态异常
    element.animators.sort((a, b) => a.getMaxTime() - b.getMaxTime());

    element.stopAnimation(...args);
  } else {
    element.animators.slice().forEach((animator) => {
      if (action === 'start' && typeof animator.__$easing !== 'undefined') {
        args = [animator.__$easing];
      }

      animator[action](...args);
    });
  }

  element?.__zr?.wakeUp();
}

/**
 * 元素组的动画操作
 */
export function elementGroupAnimationAction(
  element: zrender.Element,
  action: 'start' | 'pause' | 'resume' | 'stop',
  ...args
) {
  elementAnimationAction(element, action, ...args);

  if (element.isGroup) {
    (element as zrender.Group).eachChild((item) => {
      elementGroupAnimationAction(item, action, ...args);
    });
  }
}

/**
 * 将多个动画控制器合并为一个
 */
function combineAnimator(animators: Animator<Element>[]) {
  function animatorAction(
    action: 'start' | 'pause' | 'resume' | 'stop',
    ...args: unknown[]
  ) {
    /**
     * @see https://ecomfe.github.io/zrender-doc/public/api.html#zrenderanimator
     */
    animators.forEach((animator) => animator[action](...args));
  }

  return {
    start: (...args) => animatorAction('start', ...args),
    pause: (...args) => animatorAction('pause', ...args),
    resume: (...args) => animatorAction('resume', ...args),
    stop: (...args) => animatorAction('stop', ...args),
  };
}

/**
 * 设置动画
 */
export function setElementAnimation(
  relationGraphs: ReactiveZRender,
  element: Element,
  animation: AnimationOption,
  option?: {
    // 是否 Node 节点
    isNode?: Node;
    // 是否 Edge 节点
    isEdge?: Edge;
  },
) {
  const animators: Animator<Element>[] = [];

  animators.push(
    ...setNativeAnimation(relationGraphs, element, animation, option),
  );
  animators.push(
    ...setCustomAnimation(relationGraphs, element, animation, option),
  );

  // * 必须对动画按总时长进行排序，避免在直接 stop 动画时，动画时长短的比动画时长长的后执行，出现动画的终态异常
  animators.sort((a, b) => a.getMaxTime() - b.getMaxTime());

  // ! 包含了子元素的动画
  return combineAnimator(animators);
}

/**
 * 以更新的属性对象为模板，获取原始的属性对象
 */
export function getOriginPropsByUpdateTemplate<
  O extends {
    [key: string]: unknown;
    style?: { [key: string]: unknown };
    shape?: { [key: string]: unknown };
  },
>(updateProps: O, element: zrender.Element): O {
  const { style, shape, ...rest } = updateProps;
  const originProps = {};

  if (typeof style !== 'undefined') {
    originProps.style = {};

    Object.keys(style).forEach((key) => {
      originProps.style[key] = element.style[key];
    });
  }

  if (typeof shape !== 'undefined') {
    originProps.shape = {};

    Object.keys(shape).forEach((key) => {
      originProps.shape[key] = element.shape[key];
    });
  }

  Object.keys(rest).forEach((key) => {
    originProps[key] = element[key];
  });

  return originProps;
}
