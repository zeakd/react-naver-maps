import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
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
    return { target: this, eventName, cb };
  }

  _hasListener(eventName: string, cb: Listener) {
    return (this.listeners[eventName]?.indexOf(cb) ?? -1) >= 0;
  }

  _removeListener(handle: { eventName: string; cb: Listener }) {
    const arr = this.listeners[handle.eventName];
    if (arr) {
      const idx = arr.indexOf(handle.cb);
      if (idx >= 0) arr.splice(idx, 1);
    }
  }
}

interface NaverMockHandles {
  removeListener: ReturnType<typeof vi.fn>;
}

function setupNaverMock(): { kvo: MockKVO } & NaverMockHandles {
  const mockKVO = new MockKVO();

  // removeListener는 실제로 리스너를 제거해야 한다 — 그래야 unmount 후
  // set()이 콜백을 호출하지 않음을 단언해 cleanup 회귀를 catch할 수 있다.
  const removeListener = vi.fn(
    (handle: { target: MockKVO; eventName: string; cb: Listener }) => {
      handle.target._removeListener(handle);
    },
  );

  (globalThis as any).naver = {
    maps: {
      Event: {
        addListener: (target: MockKVO, eventName: string, cb: Listener) => {
          return target._addListener(eventName, cb);
        },
        removeListener,
      },
    },
  };

  return { kvo: mockKVO, removeListener };
}

describe('useKVO', () => {
  let mockKVO: MockKVO;
  let removeListener: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const setup = setupNaverMock();
    mockKVO = setup.kvo;
    removeListener = setup.removeListener;
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

  test('언마운트 시 리스너 해제 → set() 콜백 미호출', () => {
    mockKVO.set('zoom', 10);

    const { result, unmount } = renderHook(() =>
      useKVO<number>(mockKVO as any, 'zoom'),
    );

    // 구독 중에는 set()이 리렌더를 유발 (useSyncExternalStore 콜백 등록 확인)
    act(() => {
      mockKVO.set('zoom', 15);
    });
    expect(result.current).toBe(15);

    unmount();

    // removeListener가 호출되어 실제로 리스너가 제거되어야 함
    expect(removeListener).toHaveBeenCalledTimes(1);
    expect(
      mockKVO._hasListener('zoom_changed', removeListener.mock.calls[0][0].cb),
    ).toBe(false);

    // unmount 후 set해도 (a) 에러 없음, (b) 더 이상 구독 콜백 미호출 → result 고정
    act(() => {
      mockKVO.set('zoom', 20);
    });
    expect(result.current).toBe(15);
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
