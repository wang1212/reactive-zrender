/**
 * ! 配置项不应该覆盖掉用户侧的配置，一定要首先监测一下用户的配置是否存在
 */
export function overrideIfUndefined<V = unknown>(value: V, override: V) {
  return typeof value === 'undefined' ? override : value;
}

export function filterUndefinedValueProps<O>(obj: O): O {
  const result = {};

  Object.keys(obj).forEach(key => {
    if (typeof obj[key] !== 'undefined') {
      result[key] = obj[key];
    }
  });

  return result as O;
}

// eslint-disable-next-line complexity, sonarjs/cognitive-complexity
export function defaultsDeep<
  T extends { [k: string]: any } | any[],
  S extends { [k: string]: any } | any[]
>(target: T, source: S, { overlay = false, depth = 0, currentDepth = 0 } = {}): T & S {
  const keysArr = Array.isArray(source)
    ? Array.from(Array(source.length), (_, i) => i)
    : Object.keys(source);

  for (let i = 0; i < keysArr.length; i += 1) {
    const key = keysArr[i];

    if (overlay ? source[key] != null : (target as T & S)[key] == null) {
      if (
        currentDepth < depth &&
        (Array.isArray(source[key]) || (typeof source[key] === 'object' && source[key] !== null))
      ) {
        // eslint-disable-next-line no-param-reassign
        target[key] = defaultsDeep(
          (target[key] || (Array.isArray(source[key]) ? [] : {})) as T,
          source[key] as S,
          { overlay, depth, currentDepth: currentDepth + 1 }
        );
      } else {
        // eslint-disable-next-line no-param-reassign
        target[key] = source[key] as T & S;
      }
    }
  }

  return target as T & S;
}
