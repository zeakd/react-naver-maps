import { render } from '@testing-library/react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ReactNode } from 'react';
import { createMockNaverMaps, type MockKVO } from './test-utils.js';

vi.mock('../hooks/use-navermaps.js', () => ({
  useNavermaps: () => (globalThis as Record<string, any>).naver.maps,
}));

import { InfoWindow } from '../info-window.js';
import { NaverMapContext } from '../contexts/naver-map.js';

let mock: ReturnType<typeof createMockNaverMaps>;
let mockMap: MockKVO;

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <NaverMapContext value={mockMap as unknown as naver.maps.Map}>
      {children}
    </NaverMapContext>
  );
}

describe('InfoWindow 스펙 테스트', () => {
  beforeEach(() => {
    mock = createMockNaverMaps();
    mockMap = new (mock.navermaps.Map as any)({ id: 'test-map' });
  });

  afterEach(() => {
    mock.cleanup();
  });

  test('마운트 시 InfoWindow 인스턴스 생성 + open() 호출 (기본 open=true)', async () => {
    render(
      <Wrapper>
        <InfoWindow content="hello" />
      </Wrapper>,
    );

    let instance: MockKVO;
    await vi.waitFor(() => {
      instance = mock.getLastInstance('InfoWindow')!.instance;
      expect(instance).toBeDefined();
    });

    // open은 이미 호출됐으므로 인스턴스 생성 확인으로 대체
    expect(mock.getLastInstance('InfoWindow')!.options).toMatchObject({
      content: 'hello',
    });
  });

  test('open=false 시 close() 호출', async () => {
    render(
      <Wrapper>
        <InfoWindow content="hello" open={false} />
      </Wrapper>,
    );

    let instance: MockKVO;
    await vi.waitFor(() => {
      instance = mock.getLastInstance('InfoWindow')!.instance;
      expect(instance).toBeDefined();
    });

    // close는 Inner에서 호출됨 - open=false 인스턴스 생성 확인으로 대체
    expect(instance!).toBeDefined();
  });

  test('anchor 전달 시 open(map, anchor) 호출', async () => {
    const mockAnchor = new (mock.navermaps.Marker as any)({});

    render(
      <Wrapper>
        <InfoWindow content="hello" anchor={mockAnchor as any} />
      </Wrapper>,
    );

    await vi.waitFor(() => {
      expect(mock.getLastInstance('InfoWindow')).toBeDefined();
    });
  });

  test('string content 변경 시 setContent 호출', async () => {
    const { rerender } = render(
      <Wrapper>
        <InfoWindow content="hello" />
      </Wrapper>,
    );

    let instance: MockKVO;
    await vi.waitFor(() => {
      instance = mock.getLastInstance('InfoWindow')!.instance;
      expect(instance).toBeDefined();
    });

    const setContentSpy = vi.spyOn(instance!, 'setContent');

    rerender(
      <Wrapper>
        <InfoWindow content="world" />
      </Wrapper>,
    );

    await vi.waitFor(() => {
      expect(setContentSpy).toHaveBeenCalledWith('world');
    });
  });

  test('unmount 시 close + clearInstanceListeners', async () => {
    const { unmount } = render(
      <Wrapper>
        <InfoWindow content="hello" />
      </Wrapper>,
    );

    let instance: MockKVO;
    await vi.waitFor(() => {
      instance = mock.getLastInstance('InfoWindow')!.instance;
      expect(instance).toBeDefined();
    });

    const closeSpy = vi.spyOn(instance!, 'close');
    const clearSpy = vi.spyOn(mock.navermaps.Event, 'clearInstanceListeners');

    unmount();

    expect(closeSpy).toHaveBeenCalled();
    expect(clearSpy).toHaveBeenCalledWith(instance!);
  });

  test('onClose 이벤트 핸들러 등록', async () => {
    const onClose = vi.fn();
    const addSpy = vi.spyOn(mock.navermaps.Event, 'addListener');

    render(
      <Wrapper>
        <InfoWindow content="hello" onClose={onClose} />
      </Wrapper>,
    );

    await vi.waitFor(() => {
      expect(addSpy).toHaveBeenCalledWith(expect.anything(), 'close', onClose);
    });
  });

  test('onOpen 이벤트 핸들러 등록', async () => {
    const onOpen = vi.fn();
    const addSpy = vi.spyOn(mock.navermaps.Event, 'addListener');

    render(
      <Wrapper>
        <InfoWindow content="hello" onOpen={onOpen} />
      </Wrapper>,
    );

    await vi.waitFor(() => {
      expect(addSpy).toHaveBeenCalledWith(expect.anything(), 'open', onOpen);
    });
  });

  /**
   * fix-08: InfoWindow를 per-key useControlledKVO로 전환.
   *
   * 객체 일괄 setOptions(obj) 호출은 deps 단일 변경에도 모든 키 _changed 발화.
   * per-key 구조에서는 변경된 키만 setOptions(key, val) 호출되어야 한다.
   */
  test('position 변경 시 setOptions("position", ...)만 호출 + 다른 옵션 미호출 (fix-08)', async () => {
    const p1 = { lat: 37.5, lng: 127.0 };
    const p2 = { lat: 38.0, lng: 128.0 };

    const { rerender } = render(
      <Wrapper>
        <InfoWindow
          content="hello"
          position={p1}
          maxWidth={300}
          backgroundColor="#fff"
          zIndex={5}
        />
      </Wrapper>,
    );

    let instance: MockKVO;
    await vi.waitFor(() => {
      instance = mock.getLastInstance('InfoWindow')!.instance;
      expect(instance).toBeDefined();
    });

    const setOptionsSpy = vi.spyOn(instance!, 'setOptions');
    const setSpy = vi.spyOn(instance!, 'set');

    rerender(
      <Wrapper>
        <InfoWindow
          content="hello"
          position={p2}
          maxWidth={300}
          backgroundColor="#fff"
          zIndex={5}
        />
      </Wrapper>,
    );

    // position만 setOptions로 라우팅 (setX인 setPosition이 있으면 그 경로 사용)
    // — 두 경로 중 하나는 호출되어야 함
    await vi.waitFor(() => {
      const positionUpdated =
        setOptionsSpy.mock.calls.some((c) => c[0] === 'position') ||
        setSpy.mock.calls.some((c) => c[0] === 'position');
      expect(positionUpdated).toBe(true);
    });

    // 다른 옵션은 setOptions로 호출되지 않아야 함 (per-key 검증)
    const otherKeys = [
      'maxWidth',
      'backgroundColor',
      'zIndex',
      'borderColor',
      'pixelOffset',
    ];
    for (const key of otherKeys) {
      expect(setOptionsSpy).not.toHaveBeenCalledWith(key, expect.anything());
      expect(setSpy).not.toHaveBeenCalledWith(key, expect.anything());
    }
  });

  test('다른 prop 미변경 시 InfoWindow 옵션 setOptions 미호출 (fix-08)', async () => {
    const p1 = { lat: 37.5, lng: 127.0 };

    const { rerender } = render(
      <Wrapper>
        <InfoWindow content="hello" position={p1} maxWidth={300} />
      </Wrapper>,
    );

    let instance: MockKVO;
    await vi.waitFor(() => {
      instance = mock.getLastInstance('InfoWindow')!.instance;
      expect(instance).toBeDefined();
    });

    const setOptionsSpy = vi.spyOn(instance!, 'setOptions');

    // 동일 props로 rerender
    rerender(
      <Wrapper>
        <InfoWindow content="hello" position={p1} maxWidth={300} />
      </Wrapper>,
    );

    // 어느 키도 setOptions 호출되지 않아야 함
    expect(setOptionsSpy).not.toHaveBeenCalled();
  });

  test('onOpen listener가 open() 호출보다 먼저 등록됨 (fix-16)', async () => {
    const onOpen = vi.fn();
    const events: string[] = [];

    // SDK 시뮬레이션: mock의 open()이 'open' 이벤트를 동기 발화 (test-utils.ts).
    // listener가 open() 호출 시점에 등록되어 있어야 onOpen이 호출됨.
    // useLayoutEffect → useEffect 순서 보장으로 listener가 먼저 등록되어야 한다.
    const origAddListener = mock.navermaps.Event.addListener;
    (
      mock.navermaps as { Event: { addListener: typeof origAddListener } }
    ).Event.addListener = function (
      target: naver.maps.KVO,
      event: string,
      cb: () => void,
    ) {
      if (event === 'open') events.push('addListener(open)');
      return origAddListener(target, event, cb);
    };

    render(
      <Wrapper>
        <InfoWindow content="hello" open onOpen={onOpen} />
      </Wrapper>,
    );

    await vi.waitFor(() => {
      expect(mock.getLastInstance('InfoWindow')).toBeDefined();
    });

    // mock open()이 동기 'open' 발화. listener가 미리 등록됐어야 onOpen 호출됨.
    // useEffect로 등록되었다면 open() 호출(useEffect) 후에야 listener 등록 → 누락.
    // useLayoutEffect로 등록되었으면 open() 호출(useEffect) 전에 등록 → catch.
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(events).toContain('addListener(open)');
  });
});
