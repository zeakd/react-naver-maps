export function omitUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.keys(obj).reduce((acc, key) => {
    if (obj[key] === 'undefined') {
      return acc;
    }
    return {
      ...acc,
      [key]: obj[key],
    };
  }, {});
}
