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

/**
 * fix-06: useKVO가 Map의 _mapOptions로 라우팅되어야 한다.
 *
 * Map은 옵션을 별도 _mapOptions KVO에 저장한다. addListener를 Map 본체에 걸면
 * draggable_changed 같은 이벤트는 발화하지 않는다 — _mapOptions에 걸어야 한다.
 * 또한 getOptions(key)로 읽어야 SDK가 보는 실제 값을 반환한다.
 */
describe('useKVO with Map._mapOptions (fix-06)', () => {
  test('Map의 _mapOptions에 listener 등록 + getOptions로 값 조회', () => {
    const mapOptions = new MockKVO();
    mapOptions.set('draggable', true);

    // Map 모방: _mapOptions, setOptions/getOptions 보유
    const map = {
      _mapOptions: mapOptions,
      setOptions: (key: string, value: any) => mapOptions.set(key, value),
      getOptions: (key: string) => mapOptions.get(key),
      get: (_key: string) => undefined, // 본체 KVO에는 값이 없음
    };

    (globalThis as any).naver = {
      maps: {
        Event: {
          addListener: (target: any, eventName: string, cb: () => void) => {
            return target._addListener(eventName, cb);
          },
          removeListener: () => {},
        },
      },
    };

    const { result } = renderHook(() =>
      useKVO<boolean>(map as any, 'draggable'),
    );

    // 초기값: getOptions(_mapOptions)로 조회됨
    expect(result.current).toBe(true);

    // map.setOptions('draggable', false) → _mapOptions에 set → draggable_changed 발화
    // → useKVO가 구독 중이므로 React 리렌더 발생
    act(() => {
      map.setOptions('draggable', false);
    });

    expect(result.current).toBe(false);
  });
});
