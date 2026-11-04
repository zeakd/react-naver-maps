import { render } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { LabelLayer } from '../label-layer.js';

let instances: any[] = [];
let ctorArgs: unknown[][] = [];

function setupNaverMock() {
  instances = [];
  ctorArgs = [];
  (globalThis as any).naver = {
    maps: {
      LabelLayer: class {
        map: any = null;
        constructor(...args: unknown[]) {
          ctorArgs.push(args);
          instances.push(this);
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

vi.mock('../../hooks/use-navermaps.js', () => ({
  useNavermaps: () => (globalThis as any).naver.maps,
}));

vi.mock('../../hooks/use-map.js', () => ({
  useMap: () => ({ id: 'mock-map' }),
}));

describe('LabelLayer', () => {
  beforeEach(setupNaverMock);

  test('인자 없이 만들어 지도에 붙인다', () => {
    render(<LabelLayer />);

    expect(instances).toHaveLength(1);
    expect(ctorArgs[0]).toEqual([]);
    expect(instances[0].map).toEqual({ id: 'mock-map' });
  });

  test('다시 렌더해도 새로 만들지 않는다', () => {
    const { rerender } = render(<LabelLayer />);
    rerender(<LabelLayer />);

    expect(instances).toHaveLength(1);
  });

  test('언마운트하면 리스너를 지우고 지도에서 뗀다', () => {
    const { unmount } = render(<LabelLayer />);
    const instance = instances[0];

    unmount();

    expect(naver.maps.Event.clearInstanceListeners).toHaveBeenCalledWith(
      instance,
    );
    expect(instance.map).toBeNull();
  });

  test('ref 로 인스턴스를 준다', () => {
    const ref = { current: null as unknown };
    render(<LabelLayer ref={ref as never} />);

    expect(ref.current).toBe(instances[0]);
  });
});
