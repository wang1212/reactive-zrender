/*! 数学函数 */

/**
 * 细分二次贝塞尔曲线
 * @see https://github.com/ecomfe/zrender/blob/3e6cddaf132add09d77594466961bc4a22394fbd/src/core/curve.js#L419
 */
function quadraticSubdivide(p0: number, p1: number, p2: number, t: number): number[] {
  const out: number[] = [];
  const p01 = p0 * (1 - t) + p1 * t;
  const p12 = p1 * (1 - t) + p2 * t;
  const p012 = p01 * (1 - t) + p12 * t;

  // Seg0
  out[0] = p0;
  out[1] = p01;
  out[2] = p012;

  // Seg1
  out[3] = p012;
  out[4] = p12;
  out[5] = p2;

  return out;
}

/**
 * 获取二次贝塞尔曲线上一点
 */
export function getPointOnQuadraticBezierCurve(
  point1: [number, number],
  point2: [number, number],
  cpoint: [number, number],
  t: number
): [number, number] {
  return [
    quadraticSubdivide(point1[0], cpoint[0], point2[0], t)[2],
    quadraticSubdivide(point1[1], cpoint[1], point2[1], t)[2]
  ];
}

export function parsePercent(value: number | string, maxValue: number): number {
  if (typeof value === 'string') {
    if (value.lastIndexOf('%') >= 0) {
      return (parseFloat(value) / 100) * maxValue;
    }
    return parseFloat(value);
  }
  return value;
}
