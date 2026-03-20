import { render } from '@testing-library/react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ReactNode } from 'react';
import { createMockNaverMaps, type MockKVO } from './test-utils.js';

// useNavermaps를 mock하여 스크립트 로딩 없이 테스트
vi.mock('../hooks/use-navermaps.js', () => ({
  useNavermaps: () => (globalThis as Record<string, any>).naver.maps,
}));

// mock 설정 후 컴포넌트 import (vi.mock은 hoisting됨)
import { Marker } from '../marker.js';
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

describe('Marker 스펙 테스트', () => {
  beforeEach(() => {
    mock = createMockNaverMaps();
    mockMap = new (mock.navermaps.Map as any)({ id: 'test-map' });
  });

  afterEach(() => {
    mock.cleanup();
  });

  test('마운트 시 Marker 인스턴스 생성 + map 포함', async () => {
    render(
      <Wrapper>
        <Marker position={{ lat: 37.5, lng: 127.0 }} />
      </Wrapper>,
    );

    // useEffect 실행 대기
    await vi.waitFor(() => {
      const created = mock.getLastInstance('Marker');
      expect(created).toBeDefined();
      expect(created!.options).toMatchObject({
        map: mockMap,
        position: { lat: 37.5, lng: 127.0 },
      });
    });
  });

  test('defaultPosition으로 생성', async () => {
    render(
      <Wrapper>
        <Marker defaultPosition={{ lat: 37.5, lng: 127.0 }} />
      </Wrapper>,
    );

    await vi.waitFor(() => {
      const created = mock.getLastInstance('Marker');
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

    let markerInstance: MockKVO;
    await vi.waitFor(() => {
      markerInstance = mock.getLastInstance('Marker')!.instance;
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

    let markerInstance: MockKVO;
    await vi.waitFor(() => {
      markerInstance = mock.getLastInstance('Marker')!.instance;
      expect(markerInstance).toBeDefined();
    });

    const clearSpy = vi.spyOn(mock.navermaps.Event, 'clearInstanceListeners');
    const setMapSpy = vi.spyOn(markerInstance!, 'setMap');

    unmount();

    expect(clearSpy).toHaveBeenCalledWith(markerInstance!);
    expect(setMapSpy).toHaveBeenCalledWith(null);
  });

  test('onClick prop → addListener 등록', async () => {
    const handleClick = vi.fn();
    const addSpy = vi.spyOn(mock.navermaps.Event, 'addListener');

    render(
      <Wrapper>
        <Marker position={{ lat: 37.5, lng: 127.0 }} onClick={handleClick} />
      </Wrapper>,
    );

    await vi.waitFor(() => {
      expect(addSpy).toHaveBeenCalledWith(
        expect.anything(),
        'click',
        handleClick,
      );
    });
  });

  test('onClick 변경 시 이전 리스너 제거 + 새 리스너 등록', async () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const removeSpy = vi.spyOn(mock.navermaps.Event, 'removeListener');

    const { rerender } = render(
      <Wrapper>
        <Marker position={{ lat: 37.5, lng: 127.0 }} onClick={handler1} />
      </Wrapper>,
    );

    await vi.waitFor(() => {
      expect(mock.getLastInstance('Marker')).toBeDefined();
    });

    rerender(
      <Wrapper>
        <Marker position={{ lat: 37.5, lng: 127.0 }} onClick={handler2} />
      </Wrapper>,
    );

    await vi.waitFor(() => {
      expect(removeSpy).toHaveBeenCalled();
    });
  });

  test('static options (visible, clickable 등) KVO 동기화', async () => {
    const { rerender } = render(
      <Wrapper>
        <Marker position={{ lat: 37.5, lng: 127.0 }} visible={true} />
      </Wrapper>,
    );

    let markerInstance: MockKVO;
    await vi.waitFor(() => {
      markerInstance = mock.getLastInstance('Marker')!.instance;
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

  test('onDragend 핸들러 변경 시 리스너 교체', async () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const removeSpy = vi.spyOn(mock.navermaps.Event, 'removeListener');
    const addSpy = vi.spyOn(mock.navermaps.Event, 'addListener');

    const { rerender } = render(
      <Wrapper>
        <Marker position={{ lat: 37.5, lng: 127.0 }} onDragend={handler1} />
      </Wrapper>,
    );

    await vi.waitFor(() => {
      expect(mock.getLastInstance('Marker')).toBeDefined();
    });

    // 첫 렌더에서 dragend 리스너 등록 확인
    expect(addSpy).toHaveBeenCalledWith(expect.anything(), 'dragend', handler1);

    addSpy.mockClear();

    rerender(
      <Wrapper>
        <Marker position={{ lat: 37.5, lng: 127.0 }} onDragend={handler2} />
      </Wrapper>,
    );

    await vi.waitFor(() => {
      // 이전 리스너 제거
      expect(removeSpy).toHaveBeenCalled();
      // 새 리스너 등록
      expect(addSpy).toHaveBeenCalledWith(
        expect.anything(),
        'dragend',
        handler2,
      );
    });
  });

  test('undefined props는 생성자 옵션에서 제외 (omitUndefined)', async () => {
    render(
      <Wrapper>
        <Marker position={{ lat: 37.5, lng: 127.0 }} />
      </Wrapper>,
    );

    await vi.waitFor(() => {
      const created = mock.getLastInstance('Marker');
      expect(created).toBeDefined();
      // icon, title 등 undefined인 옵션은 포함되지 않아야 함
      expect(created!.options).not.toHaveProperty('icon');
      expect(created!.options).not.toHaveProperty('title');
    });
  });
});
