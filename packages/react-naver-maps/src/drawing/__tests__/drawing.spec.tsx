import { render } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { DrawingManager } from '../index.js';

let navermaps: Record<string, any> = {};
const map = { isReady: true };
vi.mock('../../core/hooks/use-navermaps.js', () => ({
  useNavermaps: () => navermaps,
}));
vi.mock('../../core/hooks/use-map.js', () => ({ useMap: () => map }));

type Listener = { event: string; cb: (x: unknown) => void };
let listeners: Listener[] = [];
let last: any = null;

beforeEach(() => {
  listeners = [];
  last = null;
  class Manager {
    map: unknown = null;
    options: Record<string, unknown>;
    destroyed = false;
    constructor(options: Record<string, unknown>) {
      this.options = { ...options };
      last = this; // eslint-disable-line @typescript-eslint/no-this-alias
    }
    setMap(m: unknown) {
      this.map = m;
    }
    getMap() {
      return this.map;
    }
    getOptions(k: string) {
      return this.options[k];
    }
    setOptions(k: string, v: unknown) {
      this.options[k] = v;
    }
    get() {}
    set() {}
    destroy() {
      this.destroyed = true;
    }
    getDrawings() {
      return {};
    }
  }
  navermaps = {
    drawing: {
      DrawingManager: Manager,
      DrawingEvents: {
        START: 'drawing_start',
        ADD: 'drawing_added',
        REMOVE: 'drawing_removed',
        CANCLE: 'drawing_cancled',
        SELECT: 'drawing_selected',
      },
    },
    Event: {
      addListener: (_t: unknown, event: string, cb: (x: unknown) => void) => {
        const l = { event, cb };
        listeners.push(l);
        return l;
      },
      removeListener: (l: Listener) => {
        listeners = listeners.filter((x) => x !== l);
      },
      clearInstanceListeners: vi.fn(),
    },
  };
  (globalThis as any).naver = { maps: navermaps };
});

describe('DrawingManager', () => {
  test('서브모듈이 없으면 불러오는 법을 담아 던진다', () => {
    navermaps = {};
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<DrawingManager />)).toThrow(
      /submodules=\{\['drawing'\]\}/,
    );
  });

  test('지도에 붙이고 SDK 이벤트 이름으로 핸들러를 단다', () => {
    const onAdded = vi.fn();
    const onCanceled = vi.fn();
    render(
      <DrawingManager
        onDrawingAdded={onAdded}
        onDrawingCanceled={onCanceled}
      />,
    );
    expect(last.getMap()).toBe(map);
    listeners.find((l) => l.event === 'drawing_added')!.cb('overlay');
    listeners.find((l) => l.event === 'drawing_cancled')!.cb('overlay');
    expect(onAdded).toHaveBeenCalledWith('overlay');
    expect(onCanceled).toHaveBeenCalledTimes(1);
  });

  test('drawingMode 를 바꾸면 맞추고 언마운트하면 destroy 한다', () => {
    const { rerender, unmount } = render(
      <DrawingManager drawingMode={0 as any} />,
    );
    rerender(<DrawingManager drawingMode={6 as any} />);
    expect(last.options.drawingMode).toBe(6);
    unmount();
    return Promise.resolve().then(() => expect(last.destroyed).toBe(true));
  });
});
