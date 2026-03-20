import { render } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { CadastralLayer } from '../cadastral-layer.js';

let lastInstance: any = null;

function setupNaverMock() {
  lastInstance = null;

  (globalThis as any).naver = {
    maps: {
      CadastralLayer: class {
        map: any = null;
        constructor() {
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

describe('CadastralLayer', () => {
  beforeEach(() => {
    setupNaverMock();
  });

  test('마운트 시 인스턴스 생성 + setMap 호출', () => {
    render(<CadastralLayer />);

    expect(lastInstance).not.toBeNull();
    expect(lastInstance.map).toEqual({ id: 'mock-map' });
  });

  test('unmount 시 clearInstanceListeners + setMap(null)', () => {
    const { unmount } = render(<CadastralLayer />);

    const instance = lastInstance;
    const setMapSpy = vi.spyOn(instance, 'setMap');

    unmount();

    expect(naver.maps.Event.clearInstanceListeners).toHaveBeenCalledWith(
      instance,
    );
    expect(setMapSpy).toHaveBeenCalledWith(null);
  });
});
