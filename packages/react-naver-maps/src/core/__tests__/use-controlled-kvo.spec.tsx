import { renderHook } from '@testing-library/react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMockNaverMaps, MockKVO } from './test-utils.js';
import { useControlledKVO } from '../hooks/use-controlled-kvo.js';

let mock: ReturnType<typeof createMockNaverMaps>;

describe('useControlledKVO', () => {
  beforeEach(() => {
    mock = createMockNaverMaps();
  });

  afterEach(() => {
    mock.cleanup();
  });

  test('undefined value → setter 미호출', () => {
    const target = new MockKVO({ position: { lat: 37.5, lng: 127.0 } });
    const spy = vi.spyOn(target, 'setPosition');

    renderHook(() =>
      useControlledKVO(target as unknown as naver.maps.KVO, 'position'),
    );

    expect(spy).not.toHaveBeenCalled();
  });

  test('props 변경 시 setter 호출', () => {
    const target = new MockKVO({ position: { lat: 37.5, lng: 127.0 } });
    const spy = vi.spyOn(target, 'setPosition');

    const { rerender } = renderHook(
      ({ value }) =>
        useControlledKVO(
          target as unknown as naver.maps.KVO,
          'position',
          value,
        ),
      { initialProps: { value: { lat: 37.5, lng: 127.0 } as unknown } },
    );

    // 첫 렌더에서는 isFirstRef skip으로 호출 안 됨
    expect(spy).not.toHaveBeenCalled();

    rerender({ value: { lat: 38.0, lng: 128.0 } });

    expect(spy).toHaveBeenCalledWith({ lat: 38.0, lng: 128.0 });
  });

  test('값이 같으면 setter 미호출 (kvoEquals)', () => {
    const pos = { lat: 37.5, lng: 127.0 };
    const target = new MockKVO({ position: pos });
    const spy = vi.spyOn(target, 'setPosition');

    const { rerender } = renderHook(
      ({ value }) =>
        useControlledKVO(
          target as unknown as naver.maps.KVO,
          'position',
          value,
        ),
      { initialProps: { value: pos as unknown } },
    );

    // 같은 참조로 rerender → 호출 안 됨
    rerender({ value: pos });

    expect(spy).not.toHaveBeenCalled();
  });

  test('전용 setter가 없으면 set(key, value) fallback', () => {
    const target = new MockKVO({ customProp: 'old' });
    const spy = vi.spyOn(target, 'set');

    const { rerender } = renderHook(
      ({ value }) =>
        useControlledKVO(
          target as unknown as naver.maps.KVO,
          'customProp',
          value,
        ),
      { initialProps: { value: 'old' as unknown } },
    );

    rerender({ value: 'new' });

    expect(spy).toHaveBeenCalledWith('customProp', 'new');
  });

  test('첫 렌더에서 setter 미호출 (isFirstRef skip)', () => {
    // target의 현재 값과 다른 값으로 첫 렌더 → setter 호출되지 않아야 함
    const target = new MockKVO({ position: { lat: 37.5, lng: 127.0 } });
    const spy = vi.spyOn(target, 'setPosition');

    const differentValue = { lat: 99.0, lng: 99.0 };

    const { rerender } = renderHook(
      ({ value }) =>
        useControlledKVO(
          target as unknown as naver.maps.KVO,
          'position',
          value,
        ),
      { initialProps: { value: differentValue as unknown } },
    );

    // 첫 렌더: target.get('position')과 value가 다르지만 isFirstRef로 skip
    expect(spy).not.toHaveBeenCalled();

    // 두 번째 렌더: isFirstRef가 false이므로 setter 호출
    const anotherValue = { lat: 50.0, lng: 50.0 };
    rerender({ value: anotherValue });

    expect(spy).toHaveBeenCalledWith(anotherValue);
  });
});
