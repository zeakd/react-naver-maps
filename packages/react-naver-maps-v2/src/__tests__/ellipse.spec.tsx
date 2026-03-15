import { render } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { Ellipse } from '../ellipse.js';

// Mock naver.maps
type Listener = (...args: any[]) => void;

class MockEllipse {
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

let lastEllipseInstance: MockEllipse | null = null;
const eventListeners: Array<{ target: any; event: string; cb: Listener }> = [];

function setupNaverMock() {
  lastEllipseInstance = null;
  eventListeners.length = 0;

  (globalThis as any).naver = {
    maps: {
      Ellipse: class extends MockEllipse {
        constructor(options: Record<string, any>) {
          super(options);
          lastEllipseInstance = this; // eslint-disable-line @typescript-eslint/no-this-alias
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

describe('Ellipse', () => {
  beforeEach(() => {
    setupNaverMock();
  });

  test('마운트 시 인스턴스 생성 + 옵션 확인', () => {
    render(
      <Ellipse
        defaultBounds={defaultBounds}
        strokeColor="#f00"
        fillColor="#00f"
        fillOpacity={0.5}
      />,
    );

    expect(lastEllipseInstance).not.toBeNull();
    expect(lastEllipseInstance!.options.map).toEqual({ id: 'mock-map' });
    expect(lastEllipseInstance!.options.bounds).toEqual(defaultBounds);
    expect(lastEllipseInstance!.options.strokeColor).toBe('#f00');
    expect(lastEllipseInstance!.options.fillColor).toBe('#00f');
    expect(lastEllipseInstance!.options.fillOpacity).toBe(0.5);
  });

  test('controlled prop 변경 시 setter 호출', () => {
    const { rerender } = render(<Ellipse bounds={defaultBounds} />);

    const spy = vi.spyOn(lastEllipseInstance!, 'setBounds');

    const newBounds = {
      south: 37.4,
      west: 126.8,
      north: 37.7,
      east: 127.1,
    };

    rerender(<Ellipse bounds={newBounds} />);

    expect(spy).toHaveBeenCalledWith(newBounds);
  });

  test('unmount 시 clearInstanceListeners + setMap(null)', () => {
    const { unmount } = render(<Ellipse defaultBounds={defaultBounds} />);

    const instance = lastEllipseInstance!;
    const setMapSpy = vi.spyOn(instance, 'setMap');

    unmount();

    expect(naver.maps.Event.clearInstanceListeners).toHaveBeenCalledWith(
      instance,
    );
    expect(setMapSpy).toHaveBeenCalledWith(null);
  });

  test('이벤트 바인딩', () => {
    const onClick = vi.fn();
    const onMouseout = vi.fn();

    render(
      <Ellipse
        defaultBounds={defaultBounds}
        onClick={onClick}
        onMouseout={onMouseout}
      />,
    );

    const clickListener = eventListeners.find(
      (l) => l.target === lastEllipseInstance && l.event === 'click',
    );
    const mouseoutListener = eventListeners.find(
      (l) => l.target === lastEllipseInstance && l.event === 'mouseout',
    );

    expect(clickListener).toBeDefined();
    expect(mouseoutListener).toBeDefined();

    clickListener!.cb({ coord: { lat: 37.5, lng: 127.0 } });
    expect(onClick).toHaveBeenCalled();

    mouseoutListener!.cb({ coord: { lat: 37.5, lng: 127.0 } });
    expect(onMouseout).toHaveBeenCalled();
  });

  test('undefined 옵션은 omitUndefined로 제거', () => {
    render(<Ellipse defaultBounds={defaultBounds} />);

    expect('strokeColor' in lastEllipseInstance!.options).toBe(false);
    expect('fillColor' in lastEllipseInstance!.options).toBe(false);
  });

  test('스타일 props가 KVO로 동기화', () => {
    const { rerender } = render(
      <Ellipse defaultBounds={defaultBounds} strokeWeight={2} />,
    );

    // strokeWeight 변경 시 set 호출 확인
    const setSpy = vi.spyOn(lastEllipseInstance!, 'set');

    rerender(<Ellipse defaultBounds={defaultBounds} strokeWeight={5} />);

    // useControlledKVO는 setter 없으면 set(key, value)를 호출
    expect(setSpy).toHaveBeenCalledWith('strokeWeight', 5);
  });
});
