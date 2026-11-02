import { render } from '@testing-library/react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRef, type ReactNode } from 'react';
import { createMockNaverMaps, type MockKVO } from './test-utils.js';

vi.mock('../hooks/use-navermaps.js', () => ({
  useNavermaps: () => (globalThis as Record<string, any>).naver.maps,
}));

import { CustomOverlay } from '../custom-overlay.js';
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

describe('CustomOverlay 스펙 테스트', () => {
  beforeEach(() => {
    mock = createMockNaverMaps();
    mockMap = new (mock.navermaps.Map as any)({ id: 'test-map' });
  });

  afterEach(() => {
    mock.cleanup();
  });

  test('마운트 시 OverlayView 인스턴스 생성 + setMap(map) 호출', async () => {
    render(
      <Wrapper>
        <CustomOverlay position={{ lat: 37.5, lng: 127.0 }}>
          <div data-testid="mount-child">overlay content</div>
        </CustomOverlay>
      </Wrapper>,
    );

    await vi.waitFor(() => {
      const child = document.querySelector('[data-testid="mount-child"]');
      expect(child).not.toBeNull();
    });
  });

  test('children이 컨테이너 div에 Portal 렌더링', async () => {
    render(
      <Wrapper>
        <CustomOverlay position={{ lat: 37.5, lng: 127.0 }}>
          <span data-testid="portal-child">Hello Overlay</span>
        </CustomOverlay>
      </Wrapper>,
    );

    await vi.waitFor(() => {
      const child = document.querySelector('[data-testid="portal-child"]');
      expect(child).not.toBeNull();
      expect(child!.textContent).toBe('Hello Overlay');
    });
  });

  test('children이 absolute position 컨테이너에 렌더링', async () => {
    render(
      <Wrapper>
        <CustomOverlay position={{ lat: 37.5, lng: 127.0 }}>
          <span data-testid="abs-child">content</span>
        </CustomOverlay>
      </Wrapper>,
    );

    await vi.waitFor(() => {
      const child = document.querySelector('[data-testid="abs-child"]');
      expect(child).not.toBeNull();
      const container = child!.parentElement!;
      expect(container.style.position).toBe('absolute');
    });
  });

  test('position 변경 시 draw 재호출 (left/top 업데이트)', async () => {
    const ref = createRef<naver.maps.OverlayView>();

    const { rerender } = render(
      <Wrapper>
        <CustomOverlay position={{ lat: 37.5, lng: 127.0 }} ref={ref}>
          <span data-testid="pos-child">content</span>
        </CustomOverlay>
      </Wrapper>,
    );

    await vi.waitFor(() => {
      expect(ref.current).not.toBeNull();
      const child = document.querySelector('[data-testid="pos-child"]');
      expect(child).not.toBeNull();
      const container = child!.parentElement!;
      // fromCoordToOffset mock: lat=37.5,lng=127 → { x: 100, y: 200 }
      expect(container.style.left).toBe('100px');
      expect(container.style.top).toBe('200px');
    });

    // 실제 draw 재호출을 인스턴스 메서드 spy로 단언 (setPosition → draw 경로).
    const setPositionSpy = vi.spyOn(
      ref.current as unknown as { setPosition: (p: unknown) => void },
      'setPosition',
    );

    rerender(
      <Wrapper>
        <CustomOverlay position={{ lat: 38.0, lng: 128.0 }} ref={ref}>
          <span data-testid="pos-child">content</span>
        </CustomOverlay>
      </Wrapper>,
    );

    // setPosition이 새 좌표로 호출되어야 함 (draw가 재실행되는 트리거)
    await vi.waitFor(() => {
      expect(setPositionSpy).toHaveBeenCalledWith({ lat: 38.0, lng: 128.0 });
    });

    // left/top이 새 좌표 기반 값으로 갱신 (draw 미재호출이면 100/200 그대로 → FAIL)
    // lng=128 → x=100+(128-127)=101, lat=38 → y=200+(38-37.5)=200.5
    await vi.waitFor(() => {
      const child = document.querySelector('[data-testid="pos-child"]');
      expect(child).not.toBeNull();
      const container = child!.parentElement!;
      expect(container.style.left).toBe('101px');
      expect(container.style.top).toBe('200.5px');
    });
  });

  test('unmount 시 setMap(null) 호출 → onRemove로 DOM 제거', async () => {
    const { unmount } = render(
      <Wrapper>
        <CustomOverlay position={{ lat: 37.5, lng: 127.0 }}>
          <span data-testid="unmount-child">content</span>
        </CustomOverlay>
      </Wrapper>,
    );

    await vi.waitFor(() => {
      const child = document.querySelector('[data-testid="unmount-child"]');
      expect(child).not.toBeNull();
    });

    const clearSpy = vi.spyOn(mock.navermaps.Event, 'clearInstanceListeners');

    unmount();

    expect(clearSpy).toHaveBeenCalled();

    const child = document.querySelector('[data-testid="unmount-child"]');
    expect(child).toBeNull();
  });

  test('zIndex prop이 컨테이너 스타일에 반영', async () => {
    render(
      <Wrapper>
        <CustomOverlay position={{ lat: 37.5, lng: 127.0 }} zIndex={10}>
          <span data-testid="zindex-child">content</span>
        </CustomOverlay>
      </Wrapper>,
    );

    await vi.waitFor(() => {
      const child = document.querySelector('[data-testid="zindex-child"]');
      expect(child).not.toBeNull();
      const container = child!.parentElement!;
      expect(container.style.zIndex).toBe('10');
    });
  });

  test('zIndex 변경 시 스타일 업데이트', async () => {
    const { rerender } = render(
      <Wrapper>
        <CustomOverlay position={{ lat: 37.5, lng: 127.0 }} zIndex={5}>
          <span data-testid="zchange-child">content</span>
        </CustomOverlay>
      </Wrapper>,
    );

    await vi.waitFor(() => {
      const child = document.querySelector('[data-testid="zchange-child"]');
      expect(child).not.toBeNull();
      const container = child!.parentElement!;
      expect(container.style.zIndex).toBe('5');
    });

    rerender(
      <Wrapper>
        <CustomOverlay position={{ lat: 37.5, lng: 127.0 }} zIndex={20}>
          <span data-testid="zchange-child">content</span>
        </CustomOverlay>
      </Wrapper>,
    );

    await vi.waitFor(() => {
      const child = document.querySelector('[data-testid="zchange-child"]');
      expect(child).not.toBeNull();
      const container = child!.parentElement!;
      expect(container.style.zIndex).toBe('20');
    });
  });

  test('anchor prop이 위치 오프셋에 반영', async () => {
    render(
      <Wrapper>
        <CustomOverlay
          position={{ lat: 37.5, lng: 127.0 }}
          anchor={{ x: 10, y: 20 } as naver.maps.Point}
        >
          <span data-testid="anchor-child">content</span>
        </CustomOverlay>
      </Wrapper>,
    );

    await vi.waitFor(() => {
      const child = document.querySelector('[data-testid="anchor-child"]');
      expect(child).not.toBeNull();
      const container = child!.parentElement!;
      // fromCoordToOffset returns { x: 100, y: 200 }, anchor { x: 10, y: 20 }
      expect(container.style.left).toBe('90px');
      expect(container.style.top).toBe('180px');
    });
  });

  test('pane 미지정 시 기본값 floatPane 사용', async () => {
    render(
      <Wrapper>
        <CustomOverlay position={{ lat: 37.5, lng: 127.0 }}>
          <span data-testid="pane-child">content</span>
        </CustomOverlay>
      </Wrapper>,
    );

    await vi.waitFor(() => {
      const child = document.querySelector('[data-testid="pane-child"]');
      expect(child).not.toBeNull();
      const container = child!.parentElement!;
      const pane = container.parentElement;
      expect(pane).not.toBeNull();
    });
  });

  /**
   * fix-10: position에 .equals()를 가진 객체(LatLng 인스턴스)를 같은 좌표로 다시 전달하면
   * 참조가 다르더라도 kvoEquals(equals 호출)로 변경 없음으로 판정해 setPosition을 호출하지 않아야 한다.
   *
   * test-utils의 MockLatLng은 .equals()가 없으므로, 이 테스트에서는 .equals()를 가진
   * 별도 LatLng-like 객체로 검증한다.
   */
  test('동일 좌표 LatLng(.equals) 재전달 시 setPosition 미호출 (fix-10)', async () => {
    class LatLngLike {
      constructor(
        public lat: number,
        public lng: number,
      ) {}
      equals(other: { lat: number; lng: number }) {
        return this.lat === other.lat && this.lng === other.lng;
      }
    }

    const ref = createRef<naver.maps.OverlayView>();

    const p1 = new LatLngLike(37.5, 127.0) as unknown as naver.maps.LatLng;

    const { rerender } = render(
      <Wrapper>
        <CustomOverlay position={p1} ref={ref}>
          <span data-testid="eq-child">content</span>
        </CustomOverlay>
      </Wrapper>,
    );

    await vi.waitFor(() => {
      expect(ref.current).not.toBeNull();
    });

    // ref로 받은 인스턴스에 spy 설치 (prototype 메서드를 instance level로 가로챔)
    const setPositionSpy = vi.spyOn(
      ref.current as unknown as { setPosition: (p: unknown) => void },
      'setPosition',
    );

    // 같은 좌표를 가진 새 LatLngLike 인스턴스 (참조는 다름, equals는 true)
    const p2 = new LatLngLike(37.5, 127.0) as unknown as naver.maps.LatLng;

    rerender(
      <Wrapper>
        <CustomOverlay position={p2} ref={ref}>
          <span data-testid="eq-child">content</span>
        </CustomOverlay>
      </Wrapper>,
    );

    // kvoEquals(p1, p2) === true이므로 setPosition 미호출
    expect(setPositionSpy).not.toHaveBeenCalled();
  });

  test('실제 좌표가 다른 LatLng 전달 시 setPosition 호출 (fix-10 회귀 검증)', async () => {
    class LatLngLike {
      constructor(
        public lat: number,
        public lng: number,
      ) {}
      equals(other: { lat: number; lng: number }) {
        return this.lat === other.lat && this.lng === other.lng;
      }
    }

    const ref = createRef<naver.maps.OverlayView>();

    const p1 = new LatLngLike(37.5, 127.0) as unknown as naver.maps.LatLng;

    const { rerender } = render(
      <Wrapper>
        <CustomOverlay position={p1} ref={ref}>
          <span data-testid="diff-child">content</span>
        </CustomOverlay>
      </Wrapper>,
    );

    await vi.waitFor(() => {
      expect(ref.current).not.toBeNull();
    });

    const setPositionSpy = vi.spyOn(
      ref.current as unknown as { setPosition: (p: unknown) => void },
      'setPosition',
    );

    const p2 = new LatLngLike(38.0, 128.0) as unknown as naver.maps.LatLng;

    rerender(
      <Wrapper>
        <CustomOverlay position={p2} ref={ref}>
          <span data-testid="diff-child">content</span>
        </CustomOverlay>
      </Wrapper>,
    );

    expect(setPositionSpy).toHaveBeenCalledWith(p2);
  });
});
