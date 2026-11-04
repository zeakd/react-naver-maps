import { render } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { Layer } from '../layer.js';

let instances: any[] = [];

function setupNaverMock() {
  instances = [];
  (globalThis as any).naver = {
    maps: {
      Layer: class {
        map: any = null;
        args: unknown[];
        constructor(...args: unknown[]) {
          this.args = args;
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

vi.mock('../hooks/use-navermaps.js', () => ({
  useNavermaps: () => (globalThis as any).naver.maps,
}));

vi.mock('../hooks/use-map.js', () => ({
  useMap: () => ({ id: 'mock-map' }),
}));

const getTile = () => document.createElement('div');
const mapType = { name: 'TileGrid', minZoom: 0, maxZoom: 14, getTile };

describe('Layer', () => {
  beforeEach(setupNaverMock);

  test('이름, 지도 유형, 옵션을 SDK 생성자에 넘기고 지도에 붙인다', () => {
    render(
      <Layer
        name="tileGrid"
        mapTypeOrRegistry={mapType as never}
        overlayMap
        zIndex={5}
      />,
    );

    expect(instances).toHaveLength(1);
    expect(instances[0].args).toEqual([
      'tileGrid',
      mapType,
      { overlayMap: true, zIndex: 5 },
    ]);
    expect(instances[0].map).toEqual({ id: 'mock-map' });
  });

  test('주지 않은 옵션은 생성자에 넘기지 않는다', () => {
    render(<Layer name="a" mapTypeOrRegistry={mapType as never} />);

    expect(instances[0].args[2]).toEqual({});
  });

  test('같은 값으로 다시 렌더하면 새로 만들지 않는다', () => {
    const { rerender } = render(
      <Layer name="a" mapTypeOrRegistry={mapType as never} zIndex={1} />,
    );
    rerender(
      <Layer name="a" mapTypeOrRegistry={{ ...mapType } as never} zIndex={1} />,
    );

    expect(instances).toHaveLength(1);
  });

  test.each([
    ['name', { name: 'b' }],
    ['zIndex', { zIndex: 2 }],
    ['overlayMap', { overlayMap: true }],
    ['hd', { hd: true }],
    [
      'mapTypeOrRegistry',
      { mapTypeOrRegistry: { ...mapType, maxZoom: 10 } as never },
    ],
  ])('%s 가 바뀌면 옛 레이어를 떼고 다시 만든다', (_, change) => {
    const { rerender } = render(
      <Layer name="a" mapTypeOrRegistry={mapType as never} zIndex={1} />,
    );
    const first = instances[0];

    rerender(
      <Layer
        name="a"
        mapTypeOrRegistry={mapType as never}
        zIndex={1}
        {...change}
      />,
    );

    expect(instances).toHaveLength(2);
    expect(first.map).toBeNull();
    expect(instances[1].map).toEqual({ id: 'mock-map' });
  });

  test('언마운트하면 리스너를 지우고 지도에서 뗀다', () => {
    const { unmount } = render(
      <Layer name="a" mapTypeOrRegistry={mapType as never} />,
    );
    const instance = instances[0];

    unmount();

    expect(naver.maps.Event.clearInstanceListeners).toHaveBeenCalledWith(
      instance,
    );
    expect(instance.map).toBeNull();
  });
});
