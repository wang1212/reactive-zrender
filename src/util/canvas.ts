export function measureText(
  text: string,
  fontSize: number,
  // eslint-disable-next-line sonarjs/no-duplicate-string
  fontFamily = 'Microsoft YaHei',
  fontWeight: string | number = 'normal'
) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

  return ctx.measureText(text);
}

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/TextMetrics#measuring_text_width
 */
export function measureTextWidth(
  text: string,
  fontSize: number,
  fontFamily = 'Microsoft YaHei',
  fontWeight: string | number = 'normal'
) {
  const result = measureText(text, fontSize, fontFamily, fontWeight);

  // return result.width;
  return result.actualBoundingBoxLeft + result.actualBoundingBoxRight;
}

export function measureTextLineHeight(
  text: string,
  fontSize: number,
  fontFamily = 'Microsoft YaHei',
  fontWeight: string | number = 'normal'
) {
  const result = measureText(text, fontSize, fontFamily, fontWeight);

  return result.actualBoundingBoxAscent + result.actualBoundingBoxDescent;
}
