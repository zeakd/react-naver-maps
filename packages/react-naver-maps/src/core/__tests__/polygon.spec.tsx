import { render } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { Polygon } from '../polygon.js';

// Mock naver.maps
type Listener = (...args: any[]) => void;

class MockPolygon {
  private values: Record<string, any> = {};
  options: Record<string, any>;

  constructor(options: Record<string, any>) {
    this.options = options;
    Object.assign(this.values, options);
  }

  get(key: string) {
    return this.values[key];
  }

  set(key: string, value: any) {
    this.values[key] = value;
  }

  setPaths(paths: any) {
    this.values.paths = paths;
  }

  setMap(_map: any) {
    this.values.map = _map;
  }

  getMap() {
    return this.values.map;
  }
}

let lastPolygonInstance: MockPolygon | null = null;
const eventListeners: Array<{ target: any; event: string; cb: Listener }> = [];

function setupNaverMock() {
  lastPolygonInstance = null;
  eventListeners.length = 0;

  (globalThis as any).naver = {
    maps: {
      Polygon: class extends MockPolygon {
        constructor(options: Record<string, any>) {
          super(options);
          lastPolygonInstance = this; // eslint-disable-line @typescript-eslint/no-this-alias
        }
      },
      Event: {
        addListener: (target: any, event: string, cb: Listener) => {
          const entry = { target, event, cb };
          eventListeners.push(entry);
          return entry;
        },
        removeListener: (handle: any) => {
          const idx = eventListeners.indexOf(handle);
          if (idx >= 0) eventListeners.splice(idx, 1);
        },
        clearInstanceListeners: vi.fn(),
      },
    },
  };
}

vi.mock('../hooks/use-navermaps.js', () => ({
  useNavermaps: () => (globalThis as any).naver.maps,
}));

vi.mock('../hooks/use-map.js', () => ({
  useMap: () => ({ id: 'mock-map' }),
}));

const trianglePaths = [
  [
    { lat: 37.37, lng: 127.11 },
    { lat: 37.35, lng: 127.16 },
    { lat: 37.33, lng: 127.11 },
  ],
];

describe('Polygon', () => {
  beforeEach(() => {
    setupNaverMock();
  });

  test('마운트 시 인스턴스 생성 + 옵션 확인', () => {
    render(
      <Polygon
        defaultPaths={trianglePaths}
        strokeColor="#ff0000"
        strokeWeight={2}
        fillColor="#00ff00"
        fillOpacity={0.5}
      />,
    );

    expect(lastPolygonInstance).not.toBeNull();
    expect(lastPolygonInstance!.options.map).toEqual({ id: 'mock-map' });
    expect(lastPolygonInstance!.options.paths).toBe(trianglePaths);
    expect(lastPolygonInstance!.options.strokeColor).toBe('#ff0000');
    expect(lastPolygonInstance!.options.strokeWeight).toBe(2);
    expect(lastPolygonInstance!.options.fillColor).toBe('#00ff00');
    expect(lastPolygonInstance!.options.fillOpacity).toBe(0.5);
  });

  test('controlled paths 변경 시 setPaths 호출', () => {
    const { rerender } = render(<Polygon paths={trianglePaths} />);

    const spy = vi.spyOn(lastPolygonInstance!, 'setPaths');

    const updatedPaths = [
      [
        { lat: 38.0, lng: 128.0 },
        { lat: 38.5, lng: 128.5 },
        { lat: 38.0, lng: 128.5 },
      ],
    ];

    rerender(<Polygon paths={updatedPaths} />);

    expect(spy).toHaveBeenCalledWith(updatedPaths);
  });

  test('unmount 시 clearInstanceListeners + setMap(null)', () => {
    const { unmount } = render(<Polygon defaultPaths={trianglePaths} />);

    const instance = lastPolygonInstance!;
    const setMapSpy = vi.spyOn(instance, 'setMap');

    unmount();

    expect(naver.maps.Event.clearInstanceListeners).toHaveBeenCalledWith(
      instance,
    );
    expect(setMapSpy).toHaveBeenCalledWith(null);
  });

  test('이벤트 바인딩', () => {
    const onClick = vi.fn();
    const onRightclick = vi.fn();

    render(
      <Polygon
        defaultPaths={trianglePaths}
        onClick={onClick}
        onRightclick={onRightclick}
      />,
    );

    const clickListener = eventListeners.find(
      (l) => l.target === lastPolygonInstance && l.event === 'click',
    );
    const rightclickListener = eventListeners.find(
      (l) => l.target === lastPolygonInstance && l.event === 'rightclick',
    );

    expect(clickListener).toBeDefined();
    expect(rightclickListener).toBeDefined();

    clickListener!.cb({ coord: { lat: 37.5, lng: 127.0 } });
    expect(onClick).toHaveBeenCalled();
  });

  test('undefined 옵션은 omitUndefined로 제거', () => {
    render(<Polygon defaultPaths={trianglePaths} />);

    expect('strokeColor' in lastPolygonInstance!.options).toBe(false);
    expect('fillColor' in lastPolygonInstance!.options).toBe(false);
  });
});
