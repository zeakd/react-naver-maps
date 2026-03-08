import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useControlledKVO } from '../use-controlled-kvo.js';

// Minimal KVO mock
type Listener = () => void;

class MockKVO {
  private values: Record<string, any> = {};
  private listeners: Record<string, Listener[]> = {};

  get(key: string) {
    return this.values[key];
  }

  set(key: string, value: any) {
    this.values[key] = value;
    const eventName = `${key}_changed`;
    this.listeners[eventName]?.forEach((cb) => cb());
  }

  setZoom(zoom: number) {
    this.set('zoom', zoom);
  }

  _addListener(eventName: string, cb: Listener) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(cb);
    return { eventName, cb };
  }

  _removeListener(handle: { eventName: string; cb: Listener }) {
    const arr = this.listeners[handle.eventName];
    if (arr) {
      const idx = arr.indexOf(handle.cb);
      if (idx >= 0) arr.splice(idx, 1);
    }
  }
}

function setupNaverMock() {
  const mockKVO = new MockKVO();

  (globalThis as any).naver = {
    maps: {
      Event: {
        addListener: (target: MockKVO, eventName: string, cb: Listener) => {
          return target._addListener(eventName, cb);
        },
        removeListener: (_handle: { eventName: string; cb: Listener }) => {
          // no-op for this mock
        },
      },
    },
  };

  return mockKVO;
}

describe('useControlledKVO', () => {
  let mockKVO: MockKVO;

  beforeEach(() => {
    mockKVO = setupNaverMock();
  });

  test('props 변경 시 setter 호출', () => {
    mockKVO.set('zoom', 10);
    const spy = vi.spyOn(mockKVO, 'setZoom');

    const { rerender } = renderHook(
      ({ value }) => useControlledKVO<number>(mockKVO as any, 'zoom', value),
      { initialProps: { value: 10 as number | undefined } },
    );

    // 동일 값이면 setter 미호출
    expect(spy).not.toHaveBeenCalled();

    // 다른 값으로 변경
    rerender({ value: 15 });

    expect(spy).toHaveBeenCalledWith(15);
  });

  test('동일 값이면 setter 미호출 (=== 비교)', () => {
    mockKVO.set('zoom', 10);
    const spy = vi.spyOn(mockKVO, 'setZoom');

    renderHook(() => useControlledKVO<number>(mockKVO as any, 'zoom', 10));

    expect(spy).not.toHaveBeenCalled();
  });

  test('value가 undefined면 setter 미호출 (uncontrolled)', () => {
    mockKVO.set('zoom', 10);
    const spy = vi.spyOn(mockKVO, 'setZoom');

    renderHook(() =>
      useControlledKVO<number>(mockKVO as any, 'zoom', undefined),
    );

    expect(spy).not.toHaveBeenCalled();
  });

  test('KVO 외부 변경 시 React 리렌더', () => {
    mockKVO.set('zoom', 10);

    const { result } = renderHook(() =>
      useControlledKVO<number>(mockKVO as any, 'zoom'),
    );

    expect(result.current).toBe(10);

    act(() => {
      mockKVO.set('zoom', 20);
    });

    expect(result.current).toBe(20);
  });
});
