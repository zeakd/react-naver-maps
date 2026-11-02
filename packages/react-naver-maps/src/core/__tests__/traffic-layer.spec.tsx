import { render } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { TrafficLayer } from '../traffic-layer.js';

let lastInstance: any = null;

function setupNaverMock() {
  lastInstance = null;

  (globalThis as any).naver = {
    maps: {
      TrafficLayer: class {
        map: any = null;
        options: any;
        startAutoRefresh = vi.fn();
        endAutoRefresh = vi.fn();
        constructor(options?: any) {
          this.options = options;
          lastInstance = this; // eslint-disable-line @typescript-eslint/no-this-alias
        }
        setMap(map: any) {
          this.map = map;
        }
        getMap() {
          return this.map;
        }
      },
      Event: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
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

describe('TrafficLayer', () => {
  beforeEach(() => {
    setupNaverMock();
  });

  test('마운트 시 인스턴스 생성 + setMap 호출', () => {
    render(<TrafficLayer />);

    expect(lastInstance).not.toBeNull();
    expect(lastInstance.map).toEqual({ id: 'mock-map' });
  });

  test('interval 옵션이 생성자에 전달됨', () => {
    render(<TrafficLayer interval={5000} />);

    expect(lastInstance.options).toEqual({ interval: 5000 });
  });

  test('autoRefresh=true 시 startAutoRefresh 호출', () => {
    render(<TrafficLayer autoRefresh />);

    expect(lastInstance.startAutoRefresh).toHaveBeenCalled();
  });

  test('autoRefresh true→false 변경 시 endAutoRefresh 호출', () => {
    const { rerender } = render(<TrafficLayer autoRefresh />);

    lastInstance.startAutoRefresh.mockClear();

    rerender(<TrafficLayer autoRefresh={false} />);

    expect(lastInstance.endAutoRefresh).toHaveBeenCalled();
  });

  test('unmount 시 clearInstanceListeners + setMap(null)', () => {
    const { unmount } = render(<TrafficLayer />);

    const instance = lastInstance;
    const setMapSpy = vi.spyOn(instance, 'setMap');

    unmount();

    expect(naver.maps.Event.clearInstanceListeners).toHaveBeenCalledWith(
      instance,
    );
    expect(setMapSpy).toHaveBeenCalledWith(null);
  });

  /**
   * fix-07: autoRefresh 미지정(undefined) 시 endAutoRefresh를 호출하지 않아야 한다.
   * 사용자가 prop을 안 줬으면 SDK 기본값을 따라야 함 (false로 강제하면 안 됨).
   */
  test('autoRefresh 미지정 시 endAutoRefresh/startAutoRefresh 모두 미호출 (fix-07)', () => {
    render(<TrafficLayer />);

    expect(lastInstance.endAutoRefresh).not.toHaveBeenCalled();
    expect(lastInstance.startAutoRefresh).not.toHaveBeenCalled();
  });

  test('autoRefresh undefined → undefined rerender도 미호출 유지 (fix-07)', () => {
    const { rerender } = render(<TrafficLayer />);

    rerender(<TrafficLayer interval={5000} />);

    expect(lastInstance.endAutoRefresh).not.toHaveBeenCalled();
    expect(lastInstance.startAutoRefresh).not.toHaveBeenCalled();
  });
});
