import { render } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { Circle } from '../circle.js';

// Mock naver.maps
type Listener = (...args: any[]) => void;

class MockCircle {
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

  setCenter(center: any) {
    this.values.center = center;
  }

  setRadius(radius: number) {
    this.values.radius = radius;
  }

  setMap(_map: any) {
    this.values.map = _map;
  }

  getMap() {
    return this.values.map;
  }
}

let lastCircleInstance: MockCircle | null = null;
const eventListeners: Array<{ target: any; event: string; cb: Listener }> = [];

function setupNaverMock() {
  lastCircleInstance = null;
  eventListeners.length = 0;

  const mockMap = { id: 'mock-map' };

  (globalThis as any).naver = {
    maps: {
      Circle: class extends MockCircle {
        constructor(options: Record<string, any>) {
          super(options);
          lastCircleInstance = this; // eslint-disable-line @typescript-eslint/no-this-alias
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

  return mockMap;
}

// Mock useNavermaps and useMap
vi.mock('../hooks/use-navermaps.js', () => ({
  useNavermaps: () => (globalThis as any).naver.maps,
}));

vi.mock('../hooks/use-map.js', () => ({
  useMap: () => ({ id: 'mock-map' }),
}));

describe('Circle', () => {
  beforeEach(() => {
    setupNaverMock();
  });

  test('마운트 시 인스턴스 생성 + 옵션 확인', () => {
    render(
      <Circle
        defaultCenter={{ lat: 37.5, lng: 127.0 }}
        defaultRadius={100}
        strokeColor="#f00"
        fillColor="#00f"
        fillOpacity={0.5}
      />,
    );

    expect(lastCircleInstance).not.toBeNull();
    expect(lastCircleInstance!.options.map).toEqual({ id: 'mock-map' });
    expect(lastCircleInstance!.options.center).toEqual({
      lat: 37.5,
      lng: 127.0,
    });
    expect(lastCircleInstance!.options.radius).toBe(100);
    expect(lastCircleInstance!.options.strokeColor).toBe('#f00');
    expect(lastCircleInstance!.options.fillColor).toBe('#00f');
    expect(lastCircleInstance!.options.fillOpacity).toBe(0.5);
  });

  test('controlled center 사용 시 center가 options에 전달', () => {
    render(<Circle center={{ lat: 37.5, lng: 127.0 }} defaultRadius={100} />);

    expect(lastCircleInstance!.options.center).toEqual({
      lat: 37.5,
      lng: 127.0,
    });
  });

  test('controlled prop 변경 시 setter 호출', () => {
    const { rerender } = render(
      <Circle center={{ lat: 37.5, lng: 127.0 }} radius={100} />,
    );

    const spy = vi.spyOn(lastCircleInstance!, 'setCenter');
    const radiusSpy = vi.spyOn(lastCircleInstance!, 'setRadius');

    rerender(<Circle center={{ lat: 38.0, lng: 128.0 }} radius={200} />);

    expect(spy).toHaveBeenCalledWith({ lat: 38.0, lng: 128.0 });
    expect(radiusSpy).toHaveBeenCalledWith(200);
  });

  test('unmount 시 clearInstanceListeners + setMap(null)', () => {
    const { unmount } = render(
      <Circle defaultCenter={{ lat: 37.5, lng: 127.0 }} defaultRadius={100} />,
    );

    const instance = lastCircleInstance!;
    const setMapSpy = vi.spyOn(instance, 'setMap');

    unmount();

    expect(naver.maps.Event.clearInstanceListeners).toHaveBeenCalledWith(
      instance,
    );
    expect(setMapSpy).toHaveBeenCalledWith(null);
  });

  test('이벤트 바인딩', () => {
    const onClick = vi.fn();
    const onMouseover = vi.fn();

    render(
      <Circle
        defaultCenter={{ lat: 37.5, lng: 127.0 }}
        defaultRadius={100}
        onClick={onClick}
        onMouseover={onMouseover}
      />,
    );

    const clickListener = eventListeners.find(
      (l) => l.target === lastCircleInstance && l.event === 'click',
    );
    const mouseoverListener = eventListeners.find(
      (l) => l.target === lastCircleInstance && l.event === 'mouseover',
    );

    expect(clickListener).toBeDefined();
    expect(mouseoverListener).toBeDefined();

    clickListener!.cb({ coord: { lat: 37.5, lng: 127.0 } });
    expect(onClick).toHaveBeenCalled();

    mouseoverListener!.cb({ coord: { lat: 37.5, lng: 127.0 } });
    expect(onMouseover).toHaveBeenCalled();
  });

  test('onClick 변경 시 이전 리스너 제거 + 새 리스너 추가', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const { rerender } = render(
      <Circle
        defaultCenter={{ lat: 37.5, lng: 127.0 }}
        defaultRadius={100}
        onClick={handler1}
      />,
    );

    // handler1이 click 리스너로 등록되어 있는지 확인
    const clickListener1 = eventListeners.find(
      (l) => l.target === lastCircleInstance && l.event === 'click',
    );
    expect(clickListener1).toBeDefined();
    expect(clickListener1!.cb).toBe(handler1);

    rerender(
      <Circle
        defaultCenter={{ lat: 37.5, lng: 127.0 }}
        defaultRadius={100}
        onClick={handler2}
      />,
    );

    // handler1 리스너가 제거되고 handler2로 교체
    const remainingClick = eventListeners.filter(
      (l) => l.target === lastCircleInstance && l.event === 'click',
    );
    expect(remainingClick).toHaveLength(1);
    expect(remainingClick[0].cb).toBe(handler2);
  });

  test('undefined 옵션은 omitUndefined로 제거', () => {
    render(
      <Circle defaultCenter={{ lat: 37.5, lng: 127.0 }} defaultRadius={100} />,
    );

    // strokeColor 등 미지정 옵션은 options에 포함되지 않아야 함
    expect('strokeColor' in lastCircleInstance!.options).toBe(false);
    expect('fillColor' in lastCircleInstance!.options).toBe(false);
  });
});
