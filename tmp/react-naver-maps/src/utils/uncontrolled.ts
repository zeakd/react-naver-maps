import camelcase from 'camelcase';

export type UncontrolledKey<T extends string> = `default${Capitalize<T>}`;

export function getUncontrolledKey<T extends string>(key: T): UncontrolledKey<T> {
  return camelcase(`default_${key}`) as UncontrolledKey<T>;
}

export function makeUncontrolledKeyMap<T extends readonly string[]>(keys: T) {
  return keys.reduce((acc, key) => ({ ...acc, [getUncontrolledKey(key)]: key }), {}) as {
    [key in typeof keys[number] as UncontrolledKey<key>]: key;
  };
}
