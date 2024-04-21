/* eslint-disable @typescript-eslint/no-explicit-any */
type Constructor = new (...args: any[]) => unknown;

export interface ClassManager {
  registerClass: (clz: Constructor) => Constructor;
  getClass: (type: string, throwWhenNotFound?: boolean) => Constructor;
  hasClass: (type: string) => boolean;
}

export function enableClassManagement<C extends Constructor>(target: C): C & ClassManager {
  const storage: {
    [type: string]: Constructor;
  } = {};

  (target as C & ClassManager).registerClass = function (clz: Constructor): Constructor {
    const type = ((clz as any).type || clz.prototype.type) as string;

    if (type) {
      // If only static type declared, we assign it to prototype mandatorily.
      clz.prototype.type = type;

      if (storage[type]) {
        console.warn(`Type "${type}" has already been registered, will override.`);
      }

      storage[type] = clz;
    } else {
      throw new Error(`${clz.name}.type should be specified.`);
    }

    return clz;
  };

  (target as C & ClassManager).getClass = function (
    type: string,
    throwWhenNotFound?: boolean
  ): Constructor {
    const clz = storage[type];

    if (throwWhenNotFound && !clz) {
      throw new Error(`${type}.type should be specified.`);
    }

    return clz;
  };

  (target as C & ClassManager).hasClass = function (type: string): boolean {
    return !!storage[type];
  };

  return target as C & ClassManager;
}
