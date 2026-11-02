import { describe, test, expect } from 'vitest';
import { kvoEquals } from '../hooks/use-controlled-kvo.js';

describe('kvoEquals', () => {
  test('같은 참조 → true', () => {
    const obj = { lat: 37.5, lng: 127.0 };
    expect(kvoEquals(obj, obj)).toBe(true);
  });

  test('일반 객체는 키별로 얕게 비교한다', () => {
    const a = { lat: 37.5, lng: 127.0 };
    expect(kvoEquals(a, { lat: 37.5, lng: 127.0 })).toBe(true);
    expect(kvoEquals(a, { lat: 37.5, lng: 127.1 })).toBe(false);
    expect(kvoEquals(a, { lat: 37.5 })).toBe(false);
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

  test('a에 equals 없고 b에 있으면 b.equals(a) 시도 (양쪽 비교)', () => {
    const literal = { lat: 37.5, lng: 127.0 };
    const instance = {
      lat: 37.5,
      lng: 127.0,
      equals: function (other: unknown) {
        return (
          (other as { lat?: number }).lat === this.lat &&
          (other as { lng?: number }).lng === this.lng
        );
      },
    };
    // prev=literal, new=instance
    expect(kvoEquals(literal, instance)).toBe(true);
    // prev=instance, new=literal — 기존 케이스
    expect(kvoEquals(instance, literal)).toBe(true);
  });

  test('중첩 객체와 배열은 깊이 비교하지 않는다', () => {
    expect(kvoEquals({ a: { b: 1 } }, { a: { b: 1 } })).toBe(false);
    expect(kvoEquals([1], [1])).toBe(false);
  });
});
