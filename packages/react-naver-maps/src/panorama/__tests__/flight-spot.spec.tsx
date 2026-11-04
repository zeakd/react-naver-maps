import { render } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { FlightSpot } from '../index.js';

let navermaps: Record<string, any> = {};
let instances: any[] = [];

vi.mock('../../core/hooks/use-navermaps.js', () => ({
  useNavermaps: () => navermaps,
}));
vi.mock('../../core/hooks/use-map.js', () => ({
  useMap: () => ({ id: 'mock-map' }),
}));

function setup() {
  instances = [];
  const listeners = new Map<string, Array<(...a: unknown[]) => void>>();
  const Event = {
    addListener: vi.fn((_target, name: string, cb) => {
      listeners.set(name, [...(listeners.get(name) ?? []), cb]);
      return { name, cb };
    }),
    removeListener: vi.fn((h: { name: string; cb: () => void }) => {
      listeners.set(
        h.name,
        (listeners.get(h.name) ?? []).filter((c) => c !== h.cb),
      );
    }),
    clearInstanceListeners: vi.fn(),
  };
  navermaps = {
    Panorama: function () {},
    FlightSpot: class {
      map: any = null;
      constructor() {
        instances.push(this);
      }
      setMap(map: any) {
        this.map = map;
      }
    },
    Event,
  };
  (globalThis as any).naver = { maps: navermaps };
  return {
    emit: (name: string, ...args: unknown[]) =>
      listeners.get(name)?.forEach((cb) => cb(...args)),
    listenerCount: (name: string) => listeners.get(name)?.length ?? 0,
  };
}

describe('FlightSpot', () => {
  let events: ReturnType<typeof setup>;
  beforeEach(() => {
    events = setup();
  });

  test('서브모듈이 없으면 불러오는 법을 담아 던진다', () => {
    navermaps = {};
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<FlightSpot />)).toThrow(
      /submodules=\{\['panorama'\]\}/,
    );
  });

  test('마운트하면 만들어 지도에 붙이고 언마운트하면 뗀다', () => {
    const { unmount } = render(<FlightSpot />);

    expect(instances).toHaveLength(1);
    expect(instances[0].map).toEqual({ id: 'mock-map' });

    unmount();

    expect(navermaps.Event.clearInstanceListeners).toHaveBeenCalledWith(
      instances[0],
    );
    expect(instances[0].map).toBeNull();
  });

  test('poi_clicked 의 panoId 를 onPoiClicked 로 준다', () => {
    const onPoiClicked = vi.fn();
    render(<FlightSpot onPoiClicked={onPoiClicked} />);

    events.emit('poi_clicked', 'pano-1');

    expect(onPoiClicked).toHaveBeenCalledWith('pano-1');
  });

  test('핸들러를 바꾸면 리스너를 갈아 끼우고 새로 만들지 않는다', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<FlightSpot onPoiClicked={first} />);
    rerender(<FlightSpot onPoiClicked={second} />);

    events.emit('poi_clicked', 'p');

    expect(instances).toHaveLength(1);
    expect(events.listenerCount('poi_clicked')).toBe(1);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('p');
  });

  test('onPoiClicked 가 없으면 리스너를 달지 않는다', () => {
    render(<FlightSpot />);

    expect(events.listenerCount('poi_clicked')).toBe(0);
  });
});
