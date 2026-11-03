import { render } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { CustomControl } from '../custom-control.js';

let lastControl: any = null;
const initListeners: (() => void)[] = [];
const mockMap: any = { isReady: false };

function setupNaverMock() {
  lastControl = null;
  initListeners.length = 0;
  mockMap.isReady = false;
  (globalThis as any).naver = {
    maps: {
      CustomControl: class {
        map: any = null;
        position: number;
        element = document.createElement('div');
        constructor(_html: string, options: { position: number }) {
          this.position = options.position;
          lastControl = this; // eslint-disable-line @typescript-eslint/no-this-alias
        }
        setMap(map: any) {
          this.map = map;
        }
        getMap() {
          return this.map;
        }
        getElement() {
          return this.element;
        }
        setPosition(p: number) {
          this.position = p;
        }
        getOptions(key: string) {
          return key === 'position' ? this.position : undefined;
        }
        setOptions() {}
      },
      Event: {
        addListener: (_t: unknown, event: string, cb: () => void) => {
          if (event === 'init') initListeners.push(cb);
          return { event, cb };
        },
        removeListener: vi.fn(),
        clearInstanceListeners: vi.fn(),
      },
    },
  };
}

vi.mock('../hooks/use-navermaps.js', () => ({
  useNavermaps: () => (globalThis as any).naver.maps,
}));
vi.mock('../hooks/use-map.js', () => ({ useMap: () => mockMap }));

describe('CustomControl', () => {
  beforeEach(setupNaverMock);

  test('children 을 컨트롤 element 안에 그린다', () => {
    mockMap.isReady = true;
    render(
      <CustomControl position={1 as naver.maps.Position}>
        <button>처음 위치</button>
      </CustomControl>,
    );
    expect(lastControl.getElement().textContent).toBe('처음 위치');
    expect(lastControl.getMap()).toBe(mockMap);
  });

  test('지도가 준비되기 전이면 init 뒤에 붙는다', () => {
    render(<CustomControl position={1 as naver.maps.Position} />);
    expect(lastControl.getMap()).toBe(null);
    mockMap.isReady = true;
    initListeners.forEach((cb) => cb());
    expect(lastControl.getMap()).toBe(mockMap);
  });

  test('position 을 바꾸면 옮긴다', () => {
    mockMap.isReady = true;
    const { rerender } = render(
      <CustomControl position={1 as naver.maps.Position} />,
    );
    rerender(<CustomControl position={3 as naver.maps.Position} />);
    expect(lastControl.position).toBe(3);
  });

  test('언마운트하면 지도에서 뺀다', () => {
    mockMap.isReady = true;
    const { unmount } = render(
      <CustomControl position={1 as naver.maps.Position} />,
    );
    unmount();
    expect(lastControl.getMap()).toBe(null);
  });
});
