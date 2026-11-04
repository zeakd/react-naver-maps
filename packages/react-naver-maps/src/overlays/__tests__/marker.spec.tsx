import { render } from '@testing-library/react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { StrictMode, type ReactNode } from 'react';
import {
  installSdkFake,
  type SdkFake,
  FakeKVO as FakeKVOClass,
  type FakeKVO,
} from '../../__tests__/sdk-fake.js';

// useNavermaps를 mock하여 스크립트 로딩 없이 테스트
vi.mock('../../hooks/use-navermaps.js', () => ({
  useNavermaps: () => (globalThis as Record<string, any>).naver.maps,
}));

// mock 설정 후 컴포넌트 import (vi.mock은 hoisting됨)
import { Marker } from '../marker.js';
import { NaverMapContext } from '../../map/naver-map-context.js';

let mock: SdkFake;
let mockMap: FakeKVO;

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <NaverMapContext value={mockMap as unknown as naver.maps.Map}>
      {children}
    </NaverMapContext>
  );
}

describe('Marker 스펙 테스트', () => {
  beforeEach(() => {
    mock = installSdkFake();
    mockMap = new (mock.maps.Map as any)({ id: 'test-map' });
  });

  afterEach(() => {
    mock.uninstall();
  });

  test('마운트 시 Marker 를 만들어 지도에 붙인다', async () => {
    render(
      <Wrapper>
        <Marker position={{ lat: 37.5, lng: 127.0 }} />
      </Wrapper>,
    );

    await vi.waitFor(() => {
      const created = mock.last('Marker');
      expect(created).toBeDefined();
      expect(created!.options).toMatchObject({
        position: { lat: 37.5, lng: 127.0 },
      });
      expect(created!.instance.get('map')).toBe(mockMap);
    });
  });

  test('clickable 이 false 여도 붙일 때마다 켠 채로 붙이고 되돌린다', async () => {
    // SDK 는 붙일 때 clickable 인 Marker 에만 DOM 리스너를 단다. StrictMode 는 마운트 직후
    // 뗐다 다시 붙인다(숨겼다 보일 때와 같은 경로).
    const attached: unknown[] = [];
    const setMap = FakeKVOClass.prototype.setMap;
    FakeKVOClass.prototype.setMap = function (this: FakeKVO, m: unknown) {
      if (m) attached.push(this.get('clickable'));
      setMap.call(this, m);
    };
    try {
      render(
        <StrictMode>
          <Wrapper>
            <Marker position={{ lat: 37.5, lng: 127.0 }} clickable={false} />
          </Wrapper>
        </StrictMode>,
      );
      await vi.waitFor(() => {
        const created = mock.last('Marker')!;
        expect(created.instance.get('map')).toBe(mockMap);
        expect(created.instance.get('clickable')).toBe(false);
      });
      expect(attached).toEqual([true, true]);
    } finally {
      FakeKVOClass.prototype.setMap = setMap;
    }
  });

  test('defaultPosition으로 생성', async () => {
    render(
      <Wrapper>
        <Marker defaultPosition={{ lat: 37.5, lng: 127.0 }} />
      </Wrapper>,
    );

    await vi.waitFor(() => {
      const created = mock.last('Marker');
      expect(created).toBeDefined();
      expect(created!.options).toMatchObject({
        position: { lat: 37.5, lng: 127.0 },
      });
    });
  });

  test('position prop 변경 시 setPosition 호출', async () => {
    const { rerender } = render(
      <Wrapper>
        <Marker position={{ lat: 37.5, lng: 127.0 }} />
      </Wrapper>,
    );

    let markerInstance: FakeKVO;
    await vi.waitFor(() => {
      markerInstance = mock.last('Marker')!.instance;
      expect(markerInstance).toBeDefined();
    });

    const spy = vi.spyOn(markerInstance!, 'setPosition');

    rerender(
      <Wrapper>
        <Marker position={{ lat: 38.0, lng: 128.0 }} />
      </Wrapper>,
    );

    await vi.waitFor(() => {
      expect(spy).toHaveBeenCalledWith({ lat: 38.0, lng: 128.0 });
    });
  });

  test('unmount 시 clearInstanceListeners + setMap(null) 호출', async () => {
    const { unmount } = render(
      <Wrapper>
        <Marker position={{ lat: 37.5, lng: 127.0 }} />
      </Wrapper>,
    );

    let markerInstance: FakeKVO;
    await vi.waitFor(() => {
      markerInstance = mock.last('Marker')!.instance;
      expect(markerInstance).toBeDefined();
    });

    const clearSpy = vi.spyOn(mock.maps.Event, 'clearInstanceListeners');
    const setMapSpy = vi.spyOn(markerInstance!, 'setMap');

    unmount();

    expect(clearSpy).toHaveBeenCalledWith(markerInstance!);
    expect(setMapSpy).toHaveBeenCalledWith(null);
  });

  test('onClick prop → click 이벤트 때 그 핸들러가 불린다', async () => {
    const handleClick = vi.fn();

    render(
      <Wrapper>
        <Marker position={{ lat: 37.5, lng: 127.0 }} onClick={handleClick} />
      </Wrapper>,
    );

    let instance: FakeKVO;
    await vi.waitFor(() => {
      instance = mock.last('Marker')!.instance;
      expect(instance).toBeDefined();
      expect(mock.listenerCount(instance, 'click')).toBe(1);
    });

    mock.fire(instance!, 'click', 'e1');
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith('e1');
  });

  test('onClick 변경 시 새 핸들러가 불리고 옛 핸들러는 안 불린다, 리스너는 다시 붙지 않는다', async () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const { rerender } = render(
      <Wrapper>
        <Marker position={{ lat: 37.5, lng: 127.0 }} onClick={handler1} />
      </Wrapper>,
    );

    let instance: FakeKVO;
    await vi.waitFor(() => {
      instance = mock.last('Marker')!.instance;
      expect(instance).toBeDefined();
      expect(mock.listenerCount(instance, 'click')).toBe(1);
    });

    const added = mock.listenerAdds(instance!, 'click');

    rerender(
      <Wrapper>
        <Marker position={{ lat: 37.5, lng: 127.0 }} onClick={handler2} />
      </Wrapper>,
    );

    mock.fire(instance!, 'click');
    expect(handler2).toHaveBeenCalledTimes(1);
    expect(handler1).not.toHaveBeenCalled();
    expect(mock.listenerAdds(instance!, 'click')).toBe(added);
    expect(mock.listenerCount(instance!, 'click')).toBe(1);
  });

  test('onClick 을 없애면 click 리스너를 뗀다', async () => {
    const handler = vi.fn();

    const { rerender } = render(
      <Wrapper>
        <Marker position={{ lat: 37.5, lng: 127.0 }} onClick={handler} />
      </Wrapper>,
    );

    let instance: FakeKVO;
    await vi.waitFor(() => {
      instance = mock.last('Marker')!.instance;
      expect(mock.listenerCount(instance, 'click')).toBe(1);
    });

    rerender(
      <Wrapper>
        <Marker position={{ lat: 37.5, lng: 127.0 }} />
      </Wrapper>,
    );

    await vi.waitFor(() => {
      expect(mock.listenerCount(instance!, 'click')).toBe(0);
    });
    mock.fire(instance!, 'click');
    expect(handler).not.toHaveBeenCalled();
  });

  test('static options (visible, clickable 등) KVO 동기화', async () => {
    const { rerender } = render(
      <Wrapper>
        <Marker position={{ lat: 37.5, lng: 127.0 }} visible={true} />
      </Wrapper>,
    );

    let markerInstance: FakeKVO;
    await vi.waitFor(() => {
      markerInstance = mock.last('Marker')!.instance;
      expect(markerInstance).toBeDefined();
    });

    rerender(
      <Wrapper>
        <Marker position={{ lat: 37.5, lng: 127.0 }} visible={false} />
      </Wrapper>,
    );

    await vi.waitFor(() => {
      expect(markerInstance!.get('visible')).toBe(false);
    });
  });

  test('onDragend 핸들러 변경 시 새 핸들러가 불리고 리스너는 다시 붙지 않는다', async () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const { rerender } = render(
      <Wrapper>
        <Marker position={{ lat: 37.5, lng: 127.0 }} onDragend={handler1} />
      </Wrapper>,
    );

    let instance: FakeKVO;
    await vi.waitFor(() => {
      instance = mock.last('Marker')!.instance;
      expect(instance).toBeDefined();
    });

    // 첫 렌더에서 dragend 리스너 등록 확인
    expect(mock.listenerCount(instance!, 'dragend')).toBe(1);
    mock.fire(instance!, 'dragend');
    expect(handler1).toHaveBeenCalledTimes(1);

    const added = mock.listenerAdds(instance!, 'dragend');

    rerender(
      <Wrapper>
        <Marker position={{ lat: 37.5, lng: 127.0 }} onDragend={handler2} />
      </Wrapper>,
    );

    mock.fire(instance!, 'dragend');
    expect(handler2).toHaveBeenCalledTimes(1);
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(mock.listenerAdds(instance!, 'dragend')).toBe(added);
    expect(mock.listenerCount(instance!, 'dragend')).toBe(1);
  });

  test('undefined props는 생성자 옵션에서 제외 (omitUndefined)', async () => {
    render(
      <Wrapper>
        <Marker position={{ lat: 37.5, lng: 127.0 }} />
      </Wrapper>,
    );

    await vi.waitFor(() => {
      const created = mock.last('Marker');
      expect(created).toBeDefined();
      // icon, title 등 undefined인 옵션은 포함되지 않아야 함
      expect(created!.options).not.toHaveProperty('icon');
      expect(created!.options).not.toHaveProperty('title');
    });
  });

  test('KVO 변경 이벤트는 onXChanged(값) 로, icon_loaded 는 onIconLoaded 로 받는다', async () => {
    const onPositionChanged = vi.fn();
    const onIconLoaded = vi.fn();
    render(
      <Wrapper>
        <Marker
          defaultPosition={{ lat: 37.5, lng: 127.0 }}
          draggable
          onPositionChanged={onPositionChanged}
          onIconLoaded={onIconLoaded}
        />
      </Wrapper>,
    );
    await vi.waitFor(() => expect(mock.last('Marker')).toBeDefined());
    const marker = mock.last('Marker')!.instance as FakeKVO;
    // 사용자가 끌어 SDK 가 값을 바꾼 상황
    marker.set('position', { lat: 37.6, lng: 127.1 });
    expect(onPositionChanged).toHaveBeenCalledTimes(1);
    mock.fire(marker, 'icon_loaded', marker);
    expect(onIconLoaded).toHaveBeenCalledWith(marker);
  });
});
