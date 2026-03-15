import { renderHook } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useControlledKVO } from '../use-controlled-kvo.js';

// Minimal KVO mock
class MockKVO {
  private values: Record<string, any> = {};

  get(key: string) {
    return this.values[key];
  }

  set(key: string, value: any) {
    this.values[key] = value;
  }

  setZoom(zoom: number) {
    this.set('zoom', zoom);
  }
}

describe('useControlledKVO', () => {
  let mockKVO: MockKVO;

  beforeEach(() => {
    mockKVO = new MockKVO();
  });

  test('props 변경 시 setter 호출', () => {
    mockKVO.set('zoom', 10);
    const spy = vi.spyOn(mockKVO, 'setZoom');

    const { rerender } = renderHook(
      ({ value }) => useControlledKVO(mockKVO as any, 'zoom', value),
      { initialProps: { value: 10 as number | undefined } },
    );

    // 첫 렌더 skip → setter 미호출
    expect(spy).not.toHaveBeenCalled();

    // 다른 값으로 변경
    rerender({ value: 15 });

    expect(spy).toHaveBeenCalledWith(15);
  });

  test('동일 값이면 setter 미호출 (=== 비교)', () => {
    mockKVO.set('zoom', 10);
    const spy = vi.spyOn(mockKVO, 'setZoom');

    const { rerender } = renderHook(
      ({ value }) => useControlledKVO(mockKVO as any, 'zoom', value),
      { initialProps: { value: 10 as number | undefined } },
    );

    // 첫 렌더 skip
    expect(spy).not.toHaveBeenCalled();

    // 동일 값으로 rerender — kvoEquals(10, 10)=true → setter 미호출
    rerender({ value: 10 });
    expect(spy).not.toHaveBeenCalled();
  });

  test('value가 undefined면 setter 미호출 (uncontrolled)', () => {
    mockKVO.set('zoom', 10);
    const spy = vi.spyOn(mockKVO, 'setZoom');

    const { rerender } = renderHook(
      ({ value }) => useControlledKVO(mockKVO as any, 'zoom', value),
      { initialProps: { value: undefined as number | undefined } },
    );

    // rerender해도 undefined면 setter 미호출
    rerender({ value: undefined });
    expect(spy).not.toHaveBeenCalled();
  });

  test('setter가 없으면 set(key, value) 사용', () => {
    mockKVO.set('customProp', 'old');
    const spy = vi.spyOn(mockKVO, 'set');

    const { rerender } = renderHook(
      ({ value }) => useControlledKVO(mockKVO as any, 'customProp', value),
      { initialProps: { value: 'old' as string | undefined } },
    );

    rerender({ value: 'new' });

    expect(spy).toHaveBeenCalledWith('customProp', 'new');
  });
});
