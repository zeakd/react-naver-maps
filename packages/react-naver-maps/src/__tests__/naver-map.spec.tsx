import { render } from '@testing-library/react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ReactNode } from 'react';
import { ContainerContext } from '../contexts/container.js';

// Mock Map: getCenter/getZoom/getBounds 값 추적 + morph/panTo/fitBounds/setZoom spy
class MockMap {
  private _center: any;
  private _zoom: number;
  private _bounds: any;
  private _listeners: Record<string, any[]> = {};

  morph = vi.fn();
  panTo = vi.fn();
  fitBounds = vi.fn();
  setZoom = vi.fn();
  setCenter = vi.fn();
  destroy = vi.fn();
  setMap = vi.fn();
  get = vi.fn((_key: string) => undefined);
  set = vi.fn();

  constructor(_el: HTMLElement, options: Record<string, any> = {}) {
    this._center = options.center ?? { lat: 37.5, lng: 127.0 };
    this._zoom = options.zoom ?? 16;
    this._bounds = options.bounds ?? null;
  }

  getCenter() {
    return this._center;
  }

  getZoom() {
    return this._zoom;
  }

  getBounds() {
    return this._bounds;
  }

  _addListener(eventName: string, cb: any) {
    if (!this._listeners[eventName]) this._listeners[eventName] = [];
    this._listeners[eventName].push(cb);
    return { target: this, eventName, cb };
  }

  _removeListener(handle: any) {
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

let lastMapInstance: MockMap | null = null;

function setupNaverMock() {
  lastMapInstance = null;

  (globalThis as any).naver = {
    maps: {
      Map: class extends MockMap {
        constructor(el: HTMLElement, options: Record<string, any> = {}) {
          super(el, options);
          lastMapInstance = this; // eslint-disable-line @typescript-eslint/no-this-alias
        }
      },
      Event: {
        addListener: (target: any, event: string, cb: any) => {
          if (target._addListener) return target._addListener(event, cb);
          return { target, event, cb };
        },
        removeListener: (handle: any) => {
          if (handle.target?._removeListener)
            handle.target._removeListener(handle);
        },
        clearInstanceListeners: vi.fn((target: any) => {
          if (target._clearListeners) target._clearListeners();
        }),
      },
    },
  };
}

// useNavermaps mock
vi.mock('../hooks/use-navermaps.js', () => ({
  useNavermaps: () => (globalThis as any).naver.maps,
}));

import { NaverMap } from '../naver-map.js';

const containerDiv = document.createElement('div');

function Wrapper({ children }: { children: ReactNode }) {
  return <ContainerContext value={containerDiv}>{children}</ContainerContext>;
}

describe('NaverMap center/zoom/bounds dirty diff', () => {
  beforeEach(() => {
    setupNaverMock();
  });

  afterEach(() => {
    delete (globalThis as any).naver;
    lastMapInstance = null;
  });

  test('center 변경 시 panTo 호출 (setCenter 아님)', () => {
    const { rerender } = render(
      <Wrapper>
        <NaverMap center={{ lat: 37.5, lng: 127.0 }} />
      </Wrapper>,
    );

    expect(lastMapInstance).not.toBeNull();
    const map = lastMapInstance!;

    rerender(
      <Wrapper>
        <NaverMap center={{ lat: 38.0, lng: 128.0 }} />
      </Wrapper>,
    );

    expect(map.panTo).toHaveBeenCalledWith(
      { lat: 38.0, lng: 128.0 },
      { duration: 0 },
    );
    expect(map.setCenter).not.toHaveBeenCalled();
  });

  test('zoom 변경 시 setZoom 호출', () => {
    // center를 안정적인 참조로 전달 — 매 렌더 새 객체면 center도 dirty로 감지되어 morph 경로로 빠짐
    const stableCenter = { lat: 37.5, lng: 127.0 };

    const { rerender } = render(
      <Wrapper>
        <NaverMap center={stableCenter} zoom={10} />
      </Wrapper>,
    );

    const map = lastMapInstance!;

    rerender(
      <Wrapper>
        <NaverMap center={stableCenter} zoom={15} />
      </Wrapper>,
    );

    expect(map.setZoom).toHaveBeenCalledWith(15);
  });

  test('center + zoom 동시 변경 시 morph 호출', () => {
    const { rerender } = render(
      <Wrapper>
        <NaverMap center={{ lat: 37.5, lng: 127.0 }} zoom={10} />
      </Wrapper>,
    );

    const map = lastMapInstance!;

    rerender(
      <Wrapper>
        <NaverMap center={{ lat: 38.0, lng: 128.0 }} zoom={15} />
      </Wrapper>,
    );

    expect(map.morph).toHaveBeenCalledWith({ lat: 38.0, lng: 128.0 }, 15);
    expect(map.panTo).not.toHaveBeenCalled();
    expect(map.setZoom).not.toHaveBeenCalled();
  });

  test('bounds 변경 시 fitBounds 호출', () => {
    const bounds1 = { south: 37, west: 126, north: 38, east: 128 };
    const bounds2 = { south: 35, west: 125, north: 36, east: 127 };

    const { rerender } = render(
      <Wrapper>
        <NaverMap bounds={bounds1} />
      </Wrapper>,
    );

    const map = lastMapInstance!;

    rerender(
      <Wrapper>
        <NaverMap bounds={bounds2} />
      </Wrapper>,
    );

    expect(map.fitBounds).toHaveBeenCalledWith(bounds2);
  });

  test('bounds 우선순위: bounds + center 동시 변경 시 fitBounds만 호출', () => {
    const bounds1 = { south: 37, west: 126, north: 38, east: 128 };
    const bounds2 = { south: 35, west: 125, north: 36, east: 127 };

    const { rerender } = render(
      <Wrapper>
        <NaverMap center={{ lat: 37.5, lng: 127.0 }} bounds={bounds1} />
      </Wrapper>,
    );

    const map = lastMapInstance!;

    rerender(
      <Wrapper>
        <NaverMap center={{ lat: 38.0, lng: 128.0 }} bounds={bounds2} />
      </Wrapper>,
    );

    expect(map.fitBounds).toHaveBeenCalledWith(bounds2);
    expect(map.panTo).not.toHaveBeenCalled();
    expect(map.morph).not.toHaveBeenCalled();
  });

  test('동일 center로 변경 시 panTo 미호출 (kvoEquals)', () => {
    const center = { lat: 37.5, lng: 127.0 };

    const { rerender } = render(
      <Wrapper>
        <NaverMap center={center} />
      </Wrapper>,
    );

    const map = lastMapInstance!;

    // 같은 참조로 rerender → prevRef === prop → skip
    rerender(
      <Wrapper>
        <NaverMap center={center} />
      </Wrapper>,
    );

    expect(map.panTo).not.toHaveBeenCalled();
  });

  test('uncontrolled (defaultCenter만) 시 rerender에서 setter 미호출', () => {
    const { rerender } = render(
      <Wrapper>
        <NaverMap defaultCenter={{ lat: 37.5, lng: 127.0 }} />
      </Wrapper>,
    );

    const map = lastMapInstance!;

    // prop 없이 rerender
    rerender(
      <Wrapper>
        <NaverMap defaultCenter={{ lat: 37.5, lng: 127.0 }} />
      </Wrapper>,
    );

    expect(map.panTo).not.toHaveBeenCalled();
    expect(map.setCenter).not.toHaveBeenCalled();
    expect(map.setZoom).not.toHaveBeenCalled();
    expect(map.morph).not.toHaveBeenCalled();
    expect(map.fitBounds).not.toHaveBeenCalled();
  });
});
