import { useEffect } from 'react';
import { useKVO } from './use-kvo.js';

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function kvoEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (
    typeof a === 'object' &&
    typeof b === 'object' &&
    'equals' in a &&
    typeof (a as { equals: (v: unknown) => boolean }).equals === 'function'
  ) {
    return (a as { equals: (v: unknown) => boolean }).equals(b);
  }
  return false;
}

export function useControlledKVO<T>(
  target: naver.maps.KVO,
  property: string,
  value?: T,
): T {
  const current = useKVO<T>(target, property);

  useEffect(() => {
    if (value === undefined) return;
    if (kvoEquals(current, value)) return;

    const setterName = `set${capitalize(property)}`;
    if (
      typeof (target as unknown as Record<string, unknown>)[setterName] ===
      'function'
    ) {
      (target as unknown as Record<string, (v: T) => void>)[setterName](value);
    } else {
      target.set(property, value);
    }
  }, [target, property, value, current]);

  return current;
}
