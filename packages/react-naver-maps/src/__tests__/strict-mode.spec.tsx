/**
 * StrictMode 더블 마운트 회귀 테스트
 *
 * React 19의 StrictMode는 dev에서 mount → unmount → remount를 시뮬레이션한다.
 * 이때 ref 기반 first-render skip이나 prevRef 비교가 false positive/negative를
 * 일으키지 않는지 검증.
 *
 * 검증 대상:
 * 1. useControlledKVO: isFirstRef가 새 mount에서 정상 리셋, prevRef도 새 첫 props로 초기화
 * 2. useStaticProp: initialRef/settledRef가 새 mount값으로 리셋되어 false positive 없음
 * 3. NaverMap dirty diff: 더블 마운트 후 첫 prop 변경이 정상 setter 호출 트리거
 */
import { render } from '@testing-library/react';
import { StrictMode, type ReactNode } from 'react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { useControlledKVO } from '../hooks/use-controlled-kvo.js';
import { useStaticProp } from '../hooks/use-static-prop.js';
import { ContainerContext } from '../contexts/container.js';

// =============================================================================
// useControlledKVO
// =============================================================================

class MockKVO {
  private values: Record<string, unknown> = {};
  get(key: string) {
    return this.values[key];
  }
  set(key: string, value: unknown) {
    this.values[key] = value;
  }
  setZoom = vi.fn((zoom: number) => {
    this.set('zoom', zoom);
  });
  getZoom = vi.fn(() => this.values.zoom);
}

function KvoProbe({ kvo, value }: { kvo: MockKVO; value: number }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useControlledKVO(kvo as any, 'zoom', value);
  return null;
}

describe('StrictMode + useControlledKVO', () => {
  test('더블 마운트 후 동일 값 rerender는 setter 미호출 (isFirstRef 정상 리셋)', () => {
    const kvo = new MockKVO();
    kvo.set('zoom', 10);

    const { rerender } = render(
      <StrictMode>
        <KvoProbe kvo={kvo} value={10} />
      </StrictMode>,
    );

    // StrictMode 더블 마운트에서도 첫 렌더 skip은 정상 — setter 미호출
    expect(kvo.setZoom).not.toHaveBeenCalled();

    rerender(
      <StrictMode>
        <KvoProbe kvo={kvo} value={10} />
      </StrictMode>,
    );
    // 동일값 → kvoEquals → skip
    expect(kvo.setZoom).not.toHaveBeenCalled();
  });

  test('더블 마운트 후 첫 prop 변경이 정상 setter 호출', () => {
    const kvo = new MockKVO();
    kvo.set('zoom', 10);

    const { rerender } = render(
      <StrictMode>
        <KvoProbe kvo={kvo} value={10} />
      </StrictMode>,
    );

    rerender(
      <StrictMode>
        <KvoProbe kvo={kvo} value={15} />
      </StrictMode>,
    );

    expect(kvo.setZoom).toHaveBeenCalledWith(15);
  });
});

// =============================================================================
// useStaticProp
// =============================================================================

function StaticProbe({ value }: { value: unknown }) {
  useStaticProp('TestComponent', 'foo', value);
  return null;
}

describe('StrictMode + useStaticProp', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  test('더블 마운트에서 false positive 경고 없음', () => {
    render(
      <StrictMode>
        <StaticProbe value={1} />
      </StrictMode>,
    );
    // 더블 마운트되어도 동일 value(1)이므로 경고 없음
    expect(warnSpy).not.toHaveBeenCalled();
  });

  test('더블 마운트 후 값 변경은 정상 경고', () => {
    const { rerender } = render(
      <StrictMode>
        <StaticProbe value={1} />
      </StrictMode>,
    );

    rerender(
      <StrictMode>
        <StaticProbe value={2} />
      </StrictMode>,
    );

    // 'is a static prop' 메시지가 한 번 이상 출력
    const calls = warnSpy.mock.calls.filter((c) =>
      String(c[0]).includes('is a static prop'),
    );
    expect(calls.length).toBeGreaterThanOrEqual(1);
  });

  test('undefined → 비-undefined 더블 마운트도 grace period 정상', () => {
    const { rerender } = render(
      <StrictMode>
        <StaticProbe value={undefined} />
      </StrictMode>,
    );

    rerender(
      <StrictMode>
        <StaticProbe value={true} />
      </StrictMode>,
    );

    // 더블 마운트에서도 첫 비-undefined 값을 settled로 인식해야 함
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

// =============================================================================
// NaverMap dirty diff
// =============================================================================

class MockMapOptions {
  private values: Record<string, unknown> = {};
  set(key: string, value: unknown) {
    this.values[key] = value;
  }
  get(key: string) {
    return this.values[key];
  }
}

class MockMap {
  _mapOptions = new MockMapOptions();
  morph = vi.fn();
  panTo = vi.fn();
  fitBounds = vi.fn();
  setZoom = vi.fn();
  setCenter = vi.fn();
  destroy = vi.fn();
  setMap = vi.fn();
  setSize = vi.fn();
  set = vi.fn();
  get = vi.fn(() => undefined);
  setOptions = vi.fn((key: string, value: unknown) => {
    this._mapOptions.set(key, value);
  });
  getOptions = vi.fn((key: string) => this._mapOptions.get(key));
  setMapTypeId = vi.fn();
  getMapTypeId = vi.fn(() => undefined);
  getMinZoom = vi.fn();
  getMaxZoom = vi.fn();
  getCenter() {
    return { lat: 37.5, lng: 127.0 };
  }
  getZoom() {
    return 16;
  }
  getBounds() {
    return null;
  }
  getCenterPoint() {
    return null;
  }
  _listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
  _addListener(eventName: string, cb: (...args: unknown[]) => void) {
    if (!this._listeners[eventName]) this._listeners[eventName] = [];
    this._listeners[eventName].push(cb);
    return { target: this, eventName, cb };
  }
  _removeListener(handle: { eventName: string; cb: () => void }) {
    const arr = this._listeners[handle.eventName];
    if (arr) {
      const idx = arr.indexOf(handle.cb);
      if (idx >= 0) arr.splice(idx, 1);
    }
  }
  _clearListeners() {
    this._listeners = {};
  }
}

const mapInstances: MockMap[] = [];

function setupNaverMock() {
  mapInstances.length = 0;
  (globalThis as Record<string, unknown>).naver = {
    maps: {
      Map: class extends MockMap {
        constructor(_el: HTMLElement, _options: Record<string, unknown> = {}) {
          super();
          mapInstances.push(this);
        }
      },
      Event: {
        addListener: (target: MockMap, event: string, cb: () => void) => {
          if (target._addListener) return target._addListener(event, cb);
          return { target, event, cb };
        },
        removeListener: (handle: {
          target: MockMap;
          eventName: string;
          cb: () => void;
        }) => {
          if (handle.target?._removeListener)
            handle.target._removeListener(handle);
        },
        clearInstanceListeners: vi.fn((target: MockMap) => {
          if (target._clearListeners) target._clearListeners();
        }),
      },
    },
  };
}

vi.mock('../hooks/use-navermaps.js', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useNavermaps: () => (globalThis as Record<string, any>).naver.maps,
}));

import { NaverMap } from '../naver-map.js';

const containerDiv = document.createElement('div');

function Wrapper({ children }: { children: ReactNode }) {
  return <ContainerContext value={containerDiv}>{children}</ContainerContext>;
}

describe('StrictMode + NaverMap dirty diff', () => {
  beforeEach(() => {
    setupNaverMock();
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).naver;
    mapInstances.length = 0;
  });

  test('StrictMode 더블 마운트 후 zoom 변경이 정상 setZoom 호출', () => {
    const { rerender } = render(
      <StrictMode>
        <Wrapper>
          <NaverMap zoom={10} />
        </Wrapper>
      </StrictMode>,
    );

    // 마지막에 살아있는 Map 인스턴스 (StrictMode 더블 mount 후 두 번째)
    const map = mapInstances[mapInstances.length - 1]!;

    rerender(
      <StrictMode>
        <Wrapper>
          <NaverMap zoom={15} />
        </Wrapper>
      </StrictMode>,
    );

    // dirty diff가 새 mount의 prevRef(=10)와 비교하여 setZoom(15)을 호출
    expect(map.setZoom).toHaveBeenCalledWith(15);
  });

  test('StrictMode 더블 마운트 후 동일 zoom rerender는 setter 미호출', () => {
    const { rerender } = render(
      <StrictMode>
        <Wrapper>
          <NaverMap zoom={10} />
        </Wrapper>
      </StrictMode>,
    );

    const map = mapInstances[mapInstances.length - 1]!;

    rerender(
      <StrictMode>
        <Wrapper>
          <NaverMap zoom={10} />
        </Wrapper>
      </StrictMode>,
    );

    // 동일값 → prevRef 동일 참조 또는 kvoEquals → skip
    expect(map.setZoom).not.toHaveBeenCalled();
    expect(map.morph).not.toHaveBeenCalled();
    expect(map.panTo).not.toHaveBeenCalled();
  });
});
