import { render } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { MockKVO } from './test-utils.js';

// GroundOverlay는 3인자 생성자 (url, bounds, options) — 별도 mock
let createdInstances: { url: string; bounds: unknown; instance: MockKVO }[] =
  [];
let clearCalls: unknown[] = [];

function createMockGroundOverlay(
  url: string,
  bounds: unknown,
  options?: Record<string, unknown>,
) {
  const instance = new MockKVO(options);
  instance._values.url = url;
  instance._values.bounds = bounds;
  createdInstances.push({ url, bounds, instance });
  return instance;
}

function setupMocks() {
  createdInstances = [];
  clearCalls = [];

  (globalThis as Record<string, unknown>).naver = {
    maps: {
      Event: {
        addListener: (target: MockKVO, eventName: string, cb: () => void) => {
          return target._addListener(eventName, cb);
        },
        removeListener: (
          handle: { target: MockKVO } & Record<string, unknown>,
        ) => {
          handle.target._removeListener(handle as any);
        },
        clearInstanceListeners: (target: unknown) => {
          clearCalls.push(target);
          (target as MockKVO)._clearListeners();
        },
      },
    },
  };
}

vi.mock('../hooks/use-navermaps.js', () => ({
  useNavermaps: () => ({
    GroundOverlay: createMockGroundOverlay,
  }),
}));

const mockMap = { id: 'mock-map' };
vi.mock('../hooks/use-map.js', () => ({
  useMap: () => mockMap,
}));

import { GroundOverlay } from '../ground-overlay.js';

describe('GroundOverlay 스펙 테스트', () => {
  beforeEach(() => {
    setupMocks();
  });

  test('마운트 시 GroundOverlay 인스턴스 생성', () => {
    const bounds = { south: 37.0, west: 126.0, north: 38.0, east: 127.0 };

    render(
      <GroundOverlay url="https://example.com/image.png" bounds={bounds} />,
    );

    expect(createdInstances).toHaveLength(1);
    expect(createdInstances[0].url).toBe('https://example.com/image.png');
  });

  test('url 변경 시 기존 인스턴스 cleanup + 새 인스턴스 생성', () => {
    const bounds = { south: 37.0, west: 126.0, north: 38.0, east: 127.0 };

    const { rerender } = render(
      <GroundOverlay url="https://example.com/image1.png" bounds={bounds} />,
    );

    expect(createdInstances).toHaveLength(1);
    const firstInstance = createdInstances[0].instance;

    rerender(
      <GroundOverlay url="https://example.com/image2.png" bounds={bounds} />,
    );

    expect(clearCalls).toContain(firstInstance);
    expect(createdInstances).toHaveLength(2);
    expect(createdInstances[1].url).toBe('https://example.com/image2.png');
  });

  test('bounds 변경 시 인스턴스 재생성', () => {
    const bounds1 = { south: 37.0, west: 126.0, north: 38.0, east: 127.0 };
    const bounds2 = { south: 36.0, west: 125.0, north: 37.0, east: 126.0 };

    const { rerender } = render(
      <GroundOverlay url="https://example.com/image.png" bounds={bounds1} />,
    );

    expect(createdInstances).toHaveLength(1);

    rerender(
      <GroundOverlay url="https://example.com/image.png" bounds={bounds2} />,
    );

    expect(createdInstances).toHaveLength(2);
    expect(clearCalls).toHaveLength(1);
  });

  test('opacity 변경 시 setOpacity 호출', () => {
    const bounds = { south: 37.0, west: 126.0, north: 38.0, east: 127.0 };

    const { rerender } = render(
      <GroundOverlay
        url="https://example.com/image.png"
        bounds={bounds}
        opacity={1}
      />,
    );

    const instance = createdInstances[0].instance;
    const spy = vi.spyOn(instance, 'setOpacity');

    rerender(
      <GroundOverlay
        url="https://example.com/image.png"
        bounds={bounds}
        opacity={0.5}
      />,
    );

    expect(spy).toHaveBeenCalledWith(0.5);
  });

  test('unmount 시 cleanup', () => {
    const bounds = { south: 37.0, west: 126.0, north: 38.0, east: 127.0 };

    const { unmount } = render(
      <GroundOverlay url="https://example.com/image.png" bounds={bounds} />,
    );

    const instance = createdInstances[0].instance;
    const setMapSpy = vi.spyOn(instance, 'setMap');

    unmount();

    expect(clearCalls).toContain(instance);
    expect(setMapSpy).toHaveBeenCalledWith(null);
  });

  test('onClick 이벤트 바인딩', () => {
    const bounds = { south: 37.0, west: 126.0, north: 38.0, east: 127.0 };
    const onClick = vi.fn();

    render(
      <GroundOverlay
        url="https://example.com/image.png"
        bounds={bounds}
        onClick={onClick}
      />,
    );

    const instance = createdInstances[0].instance;
    expect(instance._listeners['click']).toBeDefined();
    expect(instance._listeners['click']).toHaveLength(1);
  });
});
