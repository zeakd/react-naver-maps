import { render } from '@testing-library/react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ReactNode } from 'react';
import { createMockNaverMaps, MockKVO } from './test-utils.js';

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

  test('open prop 미전달 시 인스턴스 생성만, open/close 미호출 (ref 제어)', async () => {
    // open === undefined → InfoWindowInner의 동기 effect가 early return.
    // 자동 open/close 없이 ref로 직접 제어하는 경로.
    const openSpy = vi.spyOn(MockKVO.prototype, 'open');
    const closeSpy = vi.spyOn(MockKVO.prototype, 'close');

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

    expect(mock.getLastInstance('InfoWindow')!.options).toMatchObject({
      content: 'hello',
    });
    // 자동 open/close 없음
    expect(openSpy).not.toHaveBeenCalled();
    expect(closeSpy).not.toHaveBeenCalled();
  });

  test('open=true 시 open(map) 호출', async () => {
    // open()은 useLayoutEffect 생성 직후 useEffect에서 호출되므로
    // 인스턴스 생성 전에 prototype에 spy를 걸어 실제 호출+인자를 단언한다.
    const openSpy = vi.spyOn(MockKVO.prototype, 'open');
    const closeSpy = vi.spyOn(MockKVO.prototype, 'close');

    render(
      <Wrapper>
        <InfoWindow content="hello" open />
      </Wrapper>,
    );

    let instance: MockKVO;
    await vi.waitFor(() => {
      instance = mock.getLastInstance('InfoWindow')!.instance;
      expect(instance).toBeDefined();
    });

    await vi.waitFor(() => {
      expect(openSpy).toHaveBeenCalledTimes(1);
    });
    // anchor 없으면 open(map)만 (anchor 미전달)
    expect(openSpy.mock.contexts[0]).toBe(instance!);
    expect(openSpy.mock.calls[0]).toEqual([mockMap]);
    expect(closeSpy).not.toHaveBeenCalled();
  });

  test('open=false 시 close() 호출 (open 미호출)', async () => {
    const openSpy = vi.spyOn(MockKVO.prototype, 'open');
    const closeSpy = vi.spyOn(MockKVO.prototype, 'close');

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

    await vi.waitFor(() => {
      expect(closeSpy).toHaveBeenCalled();
    });
    expect(closeSpy.mock.contexts[0]).toBe(instance!);
    // open=false이므로 open()은 호출되지 않아야 한다
    expect(openSpy).not.toHaveBeenCalled();
  });

  test('anchor 전달 시 open(map, anchor) 호출', async () => {
    const openSpy = vi.spyOn(MockKVO.prototype, 'open');
    const mockAnchor = new (mock.navermaps.Marker as any)({});

    render(
      <Wrapper>
        <InfoWindow content="hello" open anchor={mockAnchor as any} />
      </Wrapper>,
    );

    let instance: MockKVO;
    await vi.waitFor(() => {
      instance = mock.getLastInstance('InfoWindow')!.instance;
      expect(instance).toBeDefined();
    });

    // open(map, anchor) 형태로 호출되어야 함
    await vi.waitFor(() => {
      expect(openSpy).toHaveBeenCalledTimes(1);
    });
    expect(openSpy.mock.contexts[0]).toBe(instance!);
    expect(openSpy.mock.calls[0]).toEqual([mockMap, mockAnchor]);
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

  /**
   * fix-16 (정직화): onOpen이 open() 동기 발화 시점에 실제로 호출되는지 검증한다.
   *
   * 주의 — 이 테스트는 "listener가 useLayoutEffect로 등록되었는지(layout vs passive)"를
   * 검증하지 **못한다**. 프로덕션에서 listener 등록 useEffect는 open() 호출 useEffect보다
   * **선언 순서가 앞서므로**, layout이든 passive이든 React가 hook 선언 순서대로 실행해
   * listener가 항상 먼저 등록된다. 즉 listener를 useEffect로 되돌려도 ordering은 유지되어
   * 이 경로로는 layout/passive 회귀를 catch할 수 없다 (프로덕션 동작 자체는 안전).
   *
   * 따라서 주장 범위를 "open() 동기 발화 시 onOpen/onClose가 등록되어 호출된다"로 낮춘다.
   * 이 경우 회귀 대상은: listener가 아예 등록되지 않거나, 잘못된 event명/대상에 걸리는 경우.
   */
  test('open() 동기 발화 시 onOpen 호출 + listener 등록 (fix-16)', async () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();
    const addSpy = vi.spyOn(mock.navermaps.Event, 'addListener');

    render(
      <Wrapper>
        <InfoWindow content="hello" open onOpen={onOpen} onClose={onClose} />
      </Wrapper>,
    );

    let instance: MockKVO;
    await vi.waitFor(() => {
      instance = mock.getLastInstance('InfoWindow')!.instance;
      expect(instance).toBeDefined();
    });

    // listener가 정확한 인스턴스/event명에 등록되어야 함
    await vi.waitFor(() => {
      expect(addSpy).toHaveBeenCalledWith(instance!, 'open', onOpen);
    });
    expect(addSpy).toHaveBeenCalledWith(instance!, 'close', onClose);

    // mock open()이 동기 'open' 발화 → 등록된 onOpen이 호출됨
    await vi.waitFor(() => {
      expect(onOpen).toHaveBeenCalledTimes(1);
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
