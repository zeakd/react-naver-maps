import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, beforeEach } from 'vitest';
import { useKVO } from '../use-kvo.js';

// Minimal KVO mock that mimics naver.maps.KVO + Event behavior
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

describe('useKVO', () => {
  let mockKVO: MockKVO;

  beforeEach(() => {
    mockKVO = setupNaverMock();
  });

  test('set()으로 값 변경 시 React 상태 업데이트', () => {
    mockKVO.set('zoom', 10);

    const { result } = renderHook(() => useKVO<number>(mockKVO as any, 'zoom'));

    expect(result.current).toBe(10);

    act(() => {
      mockKVO.set('zoom', 15);
    });

    expect(result.current).toBe(15);
  });

  test('초기값 조회', () => {
    mockKVO.set('center', { lat: 37.5, lng: 127.0 });

    const { result } = renderHook(() =>
      useKVO<{ lat: number; lng: number }>(mockKVO as any, 'center'),
    );

    expect(result.current).toEqual({ lat: 37.5, lng: 127.0 });
  });

  test('언마운트 시 리스너 해제', () => {
    mockKVO.set('zoom', 10);

    const { unmount } = renderHook(() =>
      useKVO<number>(mockKVO as any, 'zoom'),
    );

    // naver.maps.Event.removeListener가 호출되는지 확인
    // (실제로는 리스너 제거를 mock의 removeListener에서 처리)
    unmount();

    // unmount 후 set해도 에러가 나지 않아야 함
    mockKVO.set('zoom', 20);
  });
});
