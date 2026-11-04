import { render } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { HeatMap, DotMap } from '../index.js';

let navermaps: Record<string, unknown> = {};
vi.mock('../../hooks/use-navermaps.js', () => ({
  useNavermaps: () => navermaps,
}));
vi.mock('../../hooks/use-map.js', () => ({
  useMap: () => ({ isReady: true }),
}));

describe('visualization', () => {
  test('서브모듈이 없으면 불러오는 법을 담아 던진다', () => {
    navermaps = {};
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<HeatMap data={[]} />)).toThrow(
      /submodules=\{\['visualization'\]\}/,
    );
    expect(() => render(<DotMap data={[]} />)).toThrow(/DotMap/);
  });

  test('지도가 준비되어 있으면 만들고 바로 붙인다', () => {
    const setMap = vi.fn();
    class Layer {
      constructor(public options: Record<string, unknown>) {}
      setMap = setMap;
      getMap = () => null;
      get = vi.fn();
      set = vi.fn();
    }
    navermaps = {
      visualization: { HeatMap: Layer, DotMap: Layer },
      Event: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
        clearInstanceListeners: vi.fn(),
      },
    };
    (globalThis as any).naver = { maps: navermaps };
    render(<HeatMap data={[[127, 37]]} radius={20} />);
    expect(setMap).toHaveBeenCalledWith({ isReady: true });
  });

  test('colorMapInReverse 는 setColorMap(colorMap, true) 로 맞춘다', () => {
    const setColorMap = vi.fn();
    class Layer {
      constructor(public options: Record<string, unknown>) {}
      setMap = vi.fn();
      getMap = () => null;
      get = vi.fn();
      set = vi.fn();
      setColorMap = setColorMap;
      getColorMap = () => 'jet';
    }
    navermaps = {
      visualization: { HeatMap: Layer, DotMap: Layer },
      Event: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
        clearInstanceListeners: vi.fn(),
      },
    };
    (globalThis as any).naver = { maps: navermaps };
    const data = [{ weight: 2, location: [127, 37] as [number, number] }];
    const { rerender } = render(<HeatMap data={data} colorMapInReverse />);
    expect(setColorMap).toHaveBeenLastCalledWith('jet', true);
    rerender(<HeatMap data={data} colorMapInReverse={false} />);
    expect(setColorMap).toHaveBeenLastCalledWith('jet', false);
    expect(setColorMap).toHaveBeenCalledTimes(2);
  });
});
