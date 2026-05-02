/**
 * NaverMap controlled options 회귀 테스트
 *
 * fix-01: useControlledKVO setOptions 라우팅
 * fix-02: minZoom/maxZoom controlled 등록
 * fix-05: setX 우선순위 (mapTypeId)
 * fix-13: onInit/onIdle/onTilesloaded이 별도 useLayoutEffect로 분리되어,
 *         다른 이벤트 prop 변경 시 재등록되지 않음
 *
 * 설계: 실제 SDK 동작을 모사하기 위해
 * - Map은 옵션을 별도 `_mapOptions` KVO에 저장
 * - `setOptions(key, value)`/`getOptions(key)` → `_mapOptions.set/get`로 위임
 * - `setMapTypeId(typeId)` → 별도 registry 전환 시뮬레이션 (`_selectedTypeId`)
 * - `getMapTypeId()` → registry의 `_selectedTypeId` 반환 (mapOptions와 별개)
 */
import { render } from '@testing-library/react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ReactNode } from 'react';
import { ContainerContext } from '../contexts/container.js';

class MockMapOptions {
  private _values: Record<string, unknown> = {};
  set(key: string, value: unknown) {
    this._values[key] = value;
  }
  get(key: string) {
    return this._values[key];
  }
}

class MockMap {
  _mapOptions = new MockMapOptions();
  _selectedTypeId: string | undefined;

  morph = vi.fn();
  panTo = vi.fn();
  fitBounds = vi.fn();
  setZoom = vi.fn();
  setCenter = vi.fn();
  destroy = vi.fn();
  setMap = vi.fn();
  setSize = vi.fn();
  set = vi.fn();
  get = vi.fn((_key: string) => undefined);

  setOptions = vi.fn((key: string, value: unknown) => {
    this._mapOptions.set(key, value);
  });
  getOptions = vi.fn((key: string) => this._mapOptions.get(key));

  // setMapTypeId/getMapTypeId: registry 전환 시뮬레이션 (fix-05)
  setMapTypeId = vi.fn((typeId: string) => {
    this._selectedTypeId = typeId;
  });
  getMapTypeId = vi.fn(() => this._selectedTypeId);

  getMinZoom = vi.fn(() => this._mapOptions.get('minZoom'));
  getMaxZoom = vi.fn(() => this._mapOptions.get('maxZoom'));

  getCenter() {
    return { lat: 37.5, lng: 127.0 };
  }
  getZoom() {
    return 16;
  }
  getBounds() {
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

  constructor(_el: HTMLElement, options: Record<string, unknown> = {}) {
    // 생성자 옵션을 _mapOptions에 저장 (실제 SDK가 그렇게 함)
    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined) this._mapOptions.set(key, value);
    }
    if (typeof options.mapTypeId === 'string') {
      this._selectedTypeId = options.mapTypeId;
    }
  }
}

let lastMapInstance: MockMap | null = null;

function setupNaverMock() {
  lastMapInstance = null;

  (globalThis as Record<string, unknown>).naver = {
    maps: {
      Map: class extends MockMap {
        constructor(el: HTMLElement, options: Record<string, unknown> = {}) {
          super(el, options);
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          lastMapInstance = this;
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
  useNavermaps: () => (globalThis as Record<string, any>).naver.maps,
}));

import { NaverMap } from '../naver-map.js';

const containerDiv = document.createElement('div');

function Wrapper({ children }: { children: ReactNode }) {
  return <ContainerContext value={containerDiv}>{children}</ContainerContext>;
}

describe('NaverMap controlled options routes via setOptions (fix-01)', () => {
  beforeEach(() => {
    setupNaverMock();
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).naver;
    lastMapInstance = null;
  });

  test('draggable false → true 변경 시 setOptions("draggable", true) + _mapOptions 반영', () => {
    const { rerender } = render(
      <Wrapper>
        <NaverMap draggable={false} />
      </Wrapper>,
    );

    const map = lastMapInstance!;
    expect(map._mapOptions.get('draggable')).toBe(false);

    rerender(
      <Wrapper>
        <NaverMap draggable={true} />
      </Wrapper>,
    );

    // setOptions 경로로 _mapOptions에 라우팅됨 (Map 본체 set이 아님)
    expect(map.setOptions).toHaveBeenCalledWith('draggable', true);
    expect(map._mapOptions.get('draggable')).toBe(true);
    expect(map.set).not.toHaveBeenCalledWith('draggable', expect.anything());
  });

  test('scrollWheel/scaleControl 등 기타 옵션도 setOptions로 라우팅', () => {
    const { rerender } = render(
      <Wrapper>
        <NaverMap scrollWheel={true} scaleControl={false} />
      </Wrapper>,
    );

    const map = lastMapInstance!;

    rerender(
      <Wrapper>
        <NaverMap scrollWheel={false} scaleControl={true} />
      </Wrapper>,
    );

    expect(map.setOptions).toHaveBeenCalledWith('scrollWheel', false);
    expect(map.setOptions).toHaveBeenCalledWith('scaleControl', true);
    expect(map._mapOptions.get('scrollWheel')).toBe(false);
    expect(map._mapOptions.get('scaleControl')).toBe(true);
  });
});

describe('NaverMap minZoom/maxZoom controlled (fix-02)', () => {
  beforeEach(() => {
    setupNaverMock();
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).naver;
    lastMapInstance = null;
  });

  test('minZoom 5 → 7 변경 시 _mapOptions와 getMinZoom() 반영', () => {
    const { rerender } = render(
      <Wrapper>
        <NaverMap minZoom={5} />
      </Wrapper>,
    );

    const map = lastMapInstance!;
    expect(map._mapOptions.get('minZoom')).toBe(5);

    rerender(
      <Wrapper>
        <NaverMap minZoom={7} />
      </Wrapper>,
    );

    expect(map.setOptions).toHaveBeenCalledWith('minZoom', 7);
    expect(map.getMinZoom()).toBe(7);
  });

  test('maxZoom 변경 시 _mapOptions 반영', () => {
    const { rerender } = render(
      <Wrapper>
        <NaverMap maxZoom={18} />
      </Wrapper>,
    );

    const map = lastMapInstance!;
    expect(map._mapOptions.get('maxZoom')).toBe(18);

    rerender(
      <Wrapper>
        <NaverMap maxZoom={20} />
      </Wrapper>,
    );

    expect(map.setOptions).toHaveBeenCalledWith('maxZoom', 20);
    expect(map.getMaxZoom()).toBe(20);
  });
});

describe('NaverMap mapTypeId setX priority (fix-05)', () => {
  beforeEach(() => {
    setupNaverMock();
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).naver;
    lastMapInstance = null;
  });

  test('mapTypeId normal → satellite 변경 시 setMapTypeId 호출 (registry 전환)', () => {
    const { rerender } = render(
      <Wrapper>
        <NaverMap mapTypeId="normal" />
      </Wrapper>,
    );

    const map = lastMapInstance!;
    expect(map.getMapTypeId()).toBe('normal');

    rerender(
      <Wrapper>
        <NaverMap mapTypeId="satellite" />
      </Wrapper>,
    );

    // setX 우선순위: setMapTypeId가 호출되어 registry 전환
    expect(map.setMapTypeId).toHaveBeenCalledWith('satellite');
    expect(map.getMapTypeId()).toBe('satellite');
    // setOptions로 fallback되지 않음 (setX 우선)
    expect(map.setOptions).not.toHaveBeenCalledWith(
      'mapTypeId',
      expect.anything(),
    );
  });
});

describe('NaverMap lifecycle events register via useLayoutEffect (fix-13)', () => {
  beforeEach(() => {
    setupNaverMock();
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).naver;
    lastMapInstance = null;
  });

  test('onInit/onIdle/onTilesloaded 마운트 후 등록됨', () => {
    const onInit = vi.fn();
    const onIdle = vi.fn();
    const onTilesloaded = vi.fn();

    render(
      <Wrapper>
        <NaverMap
          onInit={onInit}
          onIdle={onIdle}
          onTilesloaded={onTilesloaded}
        />
      </Wrapper>,
    );

    const map = lastMapInstance!;
    expect(map._listeners.init).toHaveLength(1);
    expect(map._listeners.idle).toHaveLength(1);
    expect(map._listeners.tilesloaded).toHaveLength(1);

    // SDK init 발화 시뮬레이션
    map._listeners.init[0]();
    expect(onInit).toHaveBeenCalledTimes(1);
  });

  test('인터랙션 이벤트 prop 변경 시 onInit 재등록되지 않음 (별도 useLayoutEffect deps)', () => {
    const onInit = vi.fn();
    const onClick1 = vi.fn();
    const onClick2 = vi.fn();

    // addListener 호출 횟수를 이벤트별로 추적
    const naver = (globalThis as Record<string, any>).naver;
    const orig = naver.maps.Event.addListener;
    const addCalls: Record<string, number> = {};
    naver.maps.Event.addListener = (
      target: MockMap,
      event: string,
      cb: () => void,
    ) => {
      addCalls[event] = (addCalls[event] ?? 0) + 1;
      return orig(target, event, cb);
    };

    const { rerender } = render(
      <Wrapper>
        <NaverMap onInit={onInit} onClick={onClick1} />
      </Wrapper>,
    );

    const initRegistrations = addCalls.init ?? 0;
    const clickRegistrationsBefore = addCalls.click ?? 0;

    // onClick만 변경 — onInit 동일 참조 유지
    rerender(
      <Wrapper>
        <NaverMap onInit={onInit} onClick={onClick2} />
      </Wrapper>,
    );

    // onInit은 별도 useLayoutEffect에 있으므로 재등록 안 됨
    expect(addCalls.init ?? 0).toBe(initRegistrations);
    // onClick은 변경됐으므로 재등록됨
    expect(addCalls.click ?? 0).toBeGreaterThan(clickRegistrationsBefore);
  });

  test('onInit 자체 변경 시에는 재등록 (deps 추적)', () => {
    const onInit1 = vi.fn();
    const onInit2 = vi.fn();

    const naver = (globalThis as Record<string, any>).naver;
    const orig = naver.maps.Event.addListener;
    const addCalls: Record<string, number> = {};
    naver.maps.Event.addListener = (
      target: MockMap,
      event: string,
      cb: () => void,
    ) => {
      addCalls[event] = (addCalls[event] ?? 0) + 1;
      return orig(target, event, cb);
    };

    const { rerender } = render(
      <Wrapper>
        <NaverMap onInit={onInit1} />
      </Wrapper>,
    );

    const before = addCalls.init ?? 0;

    rerender(
      <Wrapper>
        <NaverMap onInit={onInit2} />
      </Wrapper>,
    );

    expect((addCalls.init ?? 0) - before).toBeGreaterThan(0);
  });
});
