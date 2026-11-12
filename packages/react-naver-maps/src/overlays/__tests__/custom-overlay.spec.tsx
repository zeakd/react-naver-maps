import { render } from '@testing-library/react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createRef,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  installSdkFake,
  type SdkFake,
  type FakeKVO,
} from '../../__tests__/sdk-fake.js';

vi.mock('../../hooks/use-navermaps.js', () => ({
  useNavermaps: () => (globalThis as Record<string, any>).naver.maps,
}));

import { CustomOverlay } from '../custom-overlay.js';
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

describe('CustomOverlay 스펙 테스트', () => {
  beforeEach(() => {
    mock = installSdkFake();
    mockMap = new (mock.maps.Map as any)({ id: 'test-map' });
  });

  afterEach(() => {
    mock.uninstall();
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

    const clearSpy = vi.spyOn(mock.maps.Event, 'clearInstanceListeners');

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
   * 리터럴과 다른 클래스의 객체로도 equals 가 쓰이는지 보려고 별도 LatLng-like 객체로 검증한다.
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

  describe('값 동기화 시점과 기준', () => {
    type Spied = { setPosition: (p: unknown) => void };
    const LL = (lat: number, lng: number) =>
      new (mock.maps.LatLng as any)(lat, lng) as naver.maps.LatLng;

    test('마운트 직후 같은 값을 다시 넘기지 않는다(생성자 값이 기준)', () => {
      // ref 는 값 동기화보다 먼저 붙으므로 그 인스턴스의 setPosition 을 감싸 센다.
      const calls: unknown[] = [];
      function Probe() {
        return (
          <CustomOverlay
            position={{ lat: 37.5, lng: 127.0 }}
            ref={(o) => {
              if (!o) return;
              const own = o as unknown as Spied;
              const original = own.setPosition.bind(own);
              own.setPosition = (p) => {
                calls.push(p);
                original(p);
              };
            }}
          >
            <span />
          </CustomOverlay>
        );
      }
      render(
        <Wrapper>
          <Probe />
        </Wrapper>,
      );
      expect(calls).toEqual([]);
    });

    test('같은 렌더의 부모 layout effect 가 ref 로 읽을 때 새 자리에 그려져 있다', () => {
      const seen: string[] = [];
      function Parent({ lng }: { lng: number }) {
        const ref = useRef<naver.maps.OverlayView | null>(null);
        useLayoutEffect(() => {
          // 첫 렌더에는 인스턴스가 아직 없다(useSdkInstance 는 첫 layout effect 뒤에 돌려준다).
          if (!ref.current) return;
          const el = (
            ref.current as unknown as { getContainerElement(): HTMLElement }
          ).getContainerElement();
          seen.push(el.style.left);
        });
        return (
          <CustomOverlay
            position={LL(37.5, lng)}
            ref={(o) => {
              ref.current = o;
            }}
          >
            <span />
          </CustomOverlay>
        );
      }
      const view = render(
        <Wrapper>
          <Parent lng={127} />
        </Wrapper>,
      );
      view.rerender(
        <Wrapper>
          <Parent lng={130} />
        </Wrapper>,
      );
      expect(seen.slice(-1)).toEqual(['103px']);
    });

    test('생성과 첫 동기화 사이에 부모가 바꾼 position 을 넘긴다', () => {
      function Parent() {
        const [lng, setLng] = useState(127);
        // 일부러 layout effect 에서 바꾼다. 인스턴스 생성과 첫 값 동기화 사이다.
        // oxlint-disable-next-line react/set-state-in-effect
        useLayoutEffect(() => setLng(131), []);
        return (
          <CustomOverlay position={LL(37.5, lng)}>
            <span data-testid="race" />
          </CustomOverlay>
        );
      }
      render(
        <Wrapper>
          <Parent />
        </Wrapper>,
      );
      const container = document.querySelector(
        '[data-testid="race"]',
      )!.parentElement!;
      expect(container.style.left).toBe('104px');
    });

    test('anchor 를 빼면 오프셋이 0 이 되고 zIndex 를 빼면 스타일이 빈다', () => {
      const view = render(
        <Wrapper>
          <CustomOverlay
            position={{ lat: 37.5, lng: 127.0 }}
            anchor={{ x: 10, y: 20 } as naver.maps.Point}
            zIndex={3}
          >
            <span data-testid="remove" />
          </CustomOverlay>
        </Wrapper>,
      );
      const container = document.querySelector(
        '[data-testid="remove"]',
      )!.parentElement!;
      expect([container.style.left, container.style.zIndex]).toEqual([
        '90px',
        '3',
      ]);
      view.rerender(
        <Wrapper>
          <CustomOverlay position={{ lat: 37.5, lng: 127.0 }}>
            <span data-testid="remove" />
          </CustomOverlay>
        </Wrapper>,
      );
      expect([container.style.left, container.style.zIndex]).toEqual([
        '100px',
        '',
      ]);
    });
  });
});
