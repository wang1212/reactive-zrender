/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-use-before-define */
/**
 * Copy from ECharts
 *
 * @see https://github.com/apache/echarts/blob/5.3.3/src/component/helper/interactionMutex.ts
 */
const ATTR = '\0_ec_interaction_mutex';

export function take(zr, resourceKey, userKey) {
  const store = getStore(zr);
  store[resourceKey] = userKey;
}

export function release(zr, resourceKey, userKey) {
  const store = getStore(zr);
  const uKey = store[resourceKey];

  if (uKey === userKey) {
    store[resourceKey] = null;
  }
}

export function isTaken(zr, resourceKey) {
  return !!getStore(zr)[resourceKey];
}

function getStore(zr) {
  return zr[ATTR] || (zr[ATTR] = {});
}
