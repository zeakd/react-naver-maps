import { render } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { Rectangle } from '../rectangle.js';

// Mock naver.maps
type Listener = (...args: any[]) => void;

class MockRectangle {
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

  setBounds(bounds: any) {
    this.values.bounds = bounds;
  }

  setMap(_map: any) {
    this.values.map = _map;
  }

  getMap() {
    return this.values.map;
  }
}

let lastRectangleInstance: MockRectangle | null = null;
const eventListeners: Array<{ target: any; event: string; cb: Listener }> = [];

function setupNaverMock() {
  lastRectangleInstance = null;
  eventListeners.length = 0;

  (globalThis as any).naver = {
    maps: {
      Rectangle: class extends MockRectangle {
        constructor(options: Record<string, any>) {
          super(options);
          lastRectangleInstance = this; // eslint-disable-line @typescript-eslint/no-this-alias
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

const defaultBounds = {
  south: 37.5,
  west: 126.9,
  north: 37.6,
  east: 127.0,
};

describe('Rectangle', () => {
  beforeEach(() => {
    setupNaverMock();
  });

  test('마운트 시 인스턴스 생성 + 옵션 확인', () => {
    render(
      <Rectangle
        defaultBounds={defaultBounds}
        strokeColor="#f00"
        fillColor="#00f"
        fillOpacity={0.5}
      />,
    );

    expect(lastRectangleInstance).not.toBeNull();
    expect(lastRectangleInstance!.options.map).toEqual({ id: 'mock-map' });
    expect(lastRectangleInstance!.options.bounds).toEqual(defaultBounds);
    expect(lastRectangleInstance!.options.strokeColor).toBe('#f00');
    expect(lastRectangleInstance!.options.fillColor).toBe('#00f');
    expect(lastRectangleInstance!.options.fillOpacity).toBe(0.5);
  });

  test('controlled prop 변경 시 setter 호출', () => {
    const { rerender } = render(<Rectangle bounds={defaultBounds} />);

    const spy = vi.spyOn(lastRectangleInstance!, 'setBounds');

    const newBounds = {
      south: 37.4,
      west: 126.8,
      north: 37.7,
      east: 127.1,
    };

    rerender(<Rectangle bounds={newBounds} />);

    expect(spy).toHaveBeenCalledWith(newBounds);
  });

  test('unmount 시 clearInstanceListeners + setMap(null)', () => {
    const { unmount } = render(<Rectangle defaultBounds={defaultBounds} />);

    const instance = lastRectangleInstance!;
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
      <Rectangle
        defaultBounds={defaultBounds}
        onClick={onClick}
        onRightclick={onRightclick}
      />,
    );

    const clickListener = eventListeners.find(
      (l) => l.target === lastRectangleInstance && l.event === 'click',
    );
    const rightclickListener = eventListeners.find(
      (l) => l.target === lastRectangleInstance && l.event === 'rightclick',
    );

    expect(clickListener).toBeDefined();
    expect(rightclickListener).toBeDefined();

    clickListener!.cb({ coord: { lat: 37.5, lng: 127.0 } });
    expect(onClick).toHaveBeenCalled();
  });

  test('undefined 옵션은 omitUndefined로 제거', () => {
    render(<Rectangle defaultBounds={defaultBounds} />);

    expect('strokeColor' in lastRectangleInstance!.options).toBe(false);
    expect('fillColor' in lastRectangleInstance!.options).toBe(false);
  });
});
