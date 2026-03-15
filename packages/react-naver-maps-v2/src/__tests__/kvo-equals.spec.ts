import { describe, test, expect } from 'vitest';
import { kvoEquals } from '../hooks/use-controlled-kvo.js';

describe('kvoEquals', () => {
  test('같은 참조 → true', () => {
    const obj = { lat: 37.5, lng: 127.0 };
    expect(kvoEquals(obj, obj)).toBe(true);
  });

  test('다른 참조, 같은 원시값 → false (=== 비교)', () => {
    const a = { lat: 37.5, lng: 127.0 };
    const b = { lat: 37.5, lng: 127.0 };
    expect(kvoEquals(a, b)).toBe(false);
  });

  test('null vs undefined → false', () => {
    expect(kvoEquals(null, undefined)).toBe(false);
    expect(kvoEquals(undefined, null)).toBe(false);
  });

  test('equals() 메서드가 있는 객체 → equals() 결과 반환', () => {
    // kvoEquals는 양쪽 모두 object일 때만 equals를 호출한다
    const target = { id: 1 };
    const a = { equals: (other: unknown) => (other as any).id === 1 };
    expect(kvoEquals(a, target)).toBe(true);
    expect(kvoEquals(a, { id: 2 })).toBe(false);
  });

  test('equals()가 true 반환 → true', () => {
    const a = { equals: () => true };
    const b = { value: 1 };
    expect(kvoEquals(a, b)).toBe(true);
  });

  test('equals()가 false 반환 → false', () => {
    const a = { equals: () => false };
    const b = { value: 1 };
    expect(kvoEquals(a, b)).toBe(false);
  });
});
