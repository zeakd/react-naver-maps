import { render } from '@testing-library/react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ReactNode } from 'react';
import {
  installSdkFake,
  type SdkFake,
  type FakeKVO,
  FakeInfoWindow,
} from '../../__tests__/sdk-fake.js';

vi.mock('../hooks/use-navermaps.js', () => ({
  useNavermaps: () => (globalThis as Record<string, any>).naver.maps,
}));

import { InfoWindow } from '../info-window.js';
import { NaverMapContext } from '../contexts/naver-map.js';

let mock: SdkFake;
let mockMap: FakeKVO;

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <NaverMapContext value={mockMap as unknown as naver.maps.Map}>
      {children}
    </NaverMapContext>
  );
}

describe('InfoWindow 스펙 테스트', () => {
  beforeEach(() => {
    mock = installSdkFake();
    mockMap = new (mock.maps.Map as any)({ id: 'test-map' });
  });

  afterEach(() => {
    mock.uninstall();
  });

  test('open prop 미전달 시 인스턴스 생성만, open/close 미호출 (ref 제어)', async () => {
    // open === undefined → InfoWindowInner의 동기 effect가 early return.
    // 자동 open/close 없이 ref로 직접 제어하는 경로.
    const openSpy = vi.spyOn(FakeInfoWindow.prototype, 'open');
    const closeSpy = vi.spyOn(FakeInfoWindow.prototype, 'close');

    render(
      <Wrapper>
        <InfoWindow content="hello" />
      </Wrapper>,
    );

    let instance: FakeKVO;
    await vi.waitFor(() => {
      instance = mock.last('InfoWindow')!.instance;
      expect(instance).toBeDefined();
    });

    expect(mock.last('InfoWindow')!.options).toMatchObject({
      content: 'hello',
    });
    // 자동 open/close 없음
    expect(openSpy).not.toHaveBeenCalled();
    expect(closeSpy).not.toHaveBeenCalled();
  });

  test('open=true 시 open(map) 호출', async () => {
    // open()은 useLayoutEffect 생성 직후 useEffect에서 호출되므로
    // 인스턴스 생성 전에 prototype에 spy를 걸어 실제 호출+인자를 단언한다.
    const openSpy = vi.spyOn(FakeInfoWindow.prototype, 'open');
    const closeSpy = vi.spyOn(FakeInfoWindow.prototype, 'close');

    render(
      <Wrapper>
        <InfoWindow content="hello" position={{ lat: 37.5, lng: 127.0 }} open />
      </Wrapper>,
    );

    let instance: FakeKVO;
    await vi.waitFor(() => {
      instance = mock.last('InfoWindow')!.instance;
      expect(instance).toBeDefined();
    });

    await vi.waitFor(() => {
      expect(openSpy).toHaveBeenCalledTimes(1);
    });
    expect(instance!.getMap()).toBe(mockMap);
    // anchor 없으면 open(map)만 (anchor 미전달)
    expect(openSpy.mock.contexts[0]).toBe(instance!);
    expect(openSpy.mock.calls[0]).toEqual([mockMap]);
    expect(closeSpy).not.toHaveBeenCalled();
  });

  test('open=false 시 close() 호출 (open 미호출)', async () => {
    const openSpy = vi.spyOn(FakeInfoWindow.prototype, 'open');
    const closeSpy = vi.spyOn(FakeInfoWindow.prototype, 'close');

    render(
      <Wrapper>
        <InfoWindow content="hello" open={false} />
      </Wrapper>,
    );

    let instance: FakeKVO;
    await vi.waitFor(() => {
      instance = mock.last('InfoWindow')!.instance;
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
    const openSpy = vi.spyOn(FakeInfoWindow.prototype, 'open');
    const mockAnchor = new (mock.maps.Marker as any)({});

    render(
      <Wrapper>
        <InfoWindow content="hello" open anchor={mockAnchor as any} />
      </Wrapper>,
    );

    let instance: FakeKVO;
    await vi.waitFor(() => {
      instance = mock.last('InfoWindow')!.instance;
      expect(instance).toBeDefined();
    });

    // open(map, anchor) 형태로 호출되어야 함
    await vi.waitFor(() => {
      expect(openSpy).toHaveBeenCalledTimes(1);
    });
    expect(openSpy.mock.contexts[0]).toBe(instance!);
    expect(openSpy.mock.calls[0]).toEqual([mockMap, mockAnchor]);
  });

  test('인라인 anchor 로 다시 렌더해도 다시 열지 않고, SDK 가 닫은 정보 창을 다시 열지 않는다', async () => {
    const openSpy = vi.spyOn(FakeInfoWindow.prototype, 'open');
    const view = (tick: number) => (
      <Wrapper>
        <InfoWindow
          content={`hello`}
          open
          anchor={{ lat: 37.5, lng: 127.0 }}
          zIndex={tick > 99 ? 1 : undefined}
        />
      </Wrapper>
    );
    const { rerender } = render(view(0));
    await vi.waitFor(() => expect(openSpy).toHaveBeenCalledTimes(1));
    // 같은 지도의 다른 정보 창이 열리거나 사용자가 닫기 버튼을 누르면 SDK 가 닫는다.
    mock.last('InfoWindow')!.instance.close();
    for (let i = 1; i <= 3; i++) rerender(view(i));
    expect(openSpy).toHaveBeenCalledTimes(1);
  });

  test('string content 변경 시 setContent 호출', async () => {
    const { rerender } = render(
      <Wrapper>
        <InfoWindow content="hello" />
      </Wrapper>,
    );

    let instance: FakeKVO;
    await vi.waitFor(() => {
      instance = mock.last('InfoWindow')!.instance;
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

    let instance: FakeKVO;
    await vi.waitFor(() => {
      instance = mock.last('InfoWindow')!.instance;
      expect(instance).toBeDefined();
    });

    const closeSpy = vi.spyOn(instance!, 'close');
    const clearSpy = vi.spyOn(mock.maps.Event, 'clearInstanceListeners');

    unmount();

    expect(closeSpy).toHaveBeenCalled();
    expect(clearSpy).toHaveBeenCalledWith(instance!);
  });

  test('onClose: close 이벤트 때 그 핸들러가 불린다', async () => {
    const onClose = vi.fn();

    render(
      <Wrapper>
        <InfoWindow content="hello" onClose={onClose} />
      </Wrapper>,
    );

    let instance: FakeKVO;
    await vi.waitFor(() => {
      instance = mock.last('InfoWindow')!.instance;
      expect(mock.listenerCount(instance, 'close')).toBe(1);
    });

    mock.fire(instance!, 'close');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('onOpen: open 이벤트 때 그 핸들러가 불린다', async () => {
    const onOpen = vi.fn();

    render(
      <Wrapper>
        <InfoWindow content="hello" onOpen={onOpen} />
      </Wrapper>,
    );

    let instance: FakeKVO;
    await vi.waitFor(() => {
      instance = mock.last('InfoWindow')!.instance;
      expect(mock.listenerCount(instance, 'open')).toBe(1);
    });

    mock.fire(instance!, 'open');
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  test('onOpen 변경 시 새 핸들러가 불리고 리스너는 다시 붙지 않는다, 없애면 뗀다', async () => {
    const onOpen1 = vi.fn();
    const onOpen2 = vi.fn();
    const { rerender } = render(
      <Wrapper>
        <InfoWindow content="hello" onOpen={onOpen1} />
      </Wrapper>,
    );

    let instance: FakeKVO;
    await vi.waitFor(() => {
      instance = mock.last('InfoWindow')!.instance;
      expect(mock.listenerCount(instance, 'open')).toBe(1);
    });

    const added = mock.listenerAdds(instance!, 'open');

    rerender(
      <Wrapper>
        <InfoWindow content="hello" onOpen={onOpen2} />
      </Wrapper>,
    );
    mock.fire(instance!, 'open');
    expect(onOpen2).toHaveBeenCalledTimes(1);
    expect(onOpen1).not.toHaveBeenCalled();
    expect(mock.listenerAdds(instance!, 'open')).toBe(added);
    expect(mock.listenerCount(instance!, 'open')).toBe(1);

    rerender(
      <Wrapper>
        <InfoWindow content="hello" />
      </Wrapper>,
    );
    await vi.waitFor(() => {
      expect(mock.listenerCount(instance!, 'open')).toBe(0);
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

    let instance: FakeKVO;
    await vi.waitFor(() => {
      instance = mock.last('InfoWindow')!.instance;
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

    let instance: FakeKVO;
    await vi.waitFor(() => {
      instance = mock.last('InfoWindow')!.instance;
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
  test('open() 동기 발화 시 onOpen 호출 + onClose 리스너 등록 (fix-16)', async () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();

    render(
      <Wrapper>
        <InfoWindow
          content="hello"
          position={{ lat: 37.5, lng: 127.0 }}
          open
          onOpen={onOpen}
          onClose={onClose}
        />
      </Wrapper>,
    );

    let instance: FakeKVO;
    await vi.waitFor(() => {
      instance = mock.last('InfoWindow')!.instance;
      expect(instance).toBeDefined();
    });

    // 리스너가 그 인스턴스의 그 이벤트에 붙어 있어야 한다
    await vi.waitFor(() => {
      expect(mock.listenerCount(instance!, 'open')).toBe(1);
    });
    expect(mock.listenerCount(instance!, 'close')).toBe(1);

    // mock open()이 동기 'open' 발화 → 등록된 onOpen이 호출됨
    await vi.waitFor(() => {
      expect(onOpen).toHaveBeenCalledTimes(1);
    });
    expect(onClose).not.toHaveBeenCalled();

    // 붙인 close 리스너는 onClose 를 부른다
    mock.fire(instance!, 'close');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
