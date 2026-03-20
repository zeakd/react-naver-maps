export function getKeys<T extends Record<string, any>>(obj: T): Array<keyof T> {
  return Object.keys(obj);
}
