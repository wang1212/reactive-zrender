/**
 * Copy from ECharts
 *
 * @see https://github.com/apache/echarts/blob/5.3.3/src/component/helper/roamHelper.ts
 */
import * as zrender from 'zrender';

interface ControllerHost {
  target: zrender.Element;
  zoom?: number;
  zoomLimit?: { min?: number; max?: number };
}

/**
 * For geo and graph.
 */
export function updateViewOnPan(controllerHost: ControllerHost, dx: number, dy: number) {
  const { target } = controllerHost;
  target.x += dx;
  target.y += dy;
  target.dirty();
}

/**
 * For geo and graph.
 */
export function updateViewOnZoom(
  controllerHost: ControllerHost,
  zoomDelta: number,
  zoomX: number,
  zoomY: number
) {
  const { target } = controllerHost;
  const { zoomLimit } = controllerHost;

  // eslint-disable-next-line no-multi-assign, no-param-reassign
  let newZoom = (controllerHost.zoom = controllerHost.zoom || 1);
  newZoom *= zoomDelta;
  if (zoomLimit) {
    const zoomMin = zoomLimit.min || 0;
    const zoomMax = zoomLimit.max || Infinity;
    newZoom = Math.max(Math.min(zoomMax, newZoom), zoomMin);
  }
  const zoomScale = newZoom / controllerHost.zoom;
  // eslint-disable-next-line no-param-reassign
  controllerHost.zoom = newZoom;
  // Keep the mouse center when scaling
  target.x -= (zoomX - target.x) * (zoomScale - 1);
  target.y -= (zoomY - target.y) * (zoomScale - 1);
  target.scaleX *= zoomScale;
  target.scaleY *= zoomScale;

  target.dirty();
}
