import { render } from '@testing-library/react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ReactNode } from 'react';
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
    const { rerender } = render(
      <Wrapper>
        <CustomOverlay position={{ lat: 37.5, lng: 127.0 }}>
          <span data-testid="pos-child">content</span>
        </CustomOverlay>
      </Wrapper>,
    );

    await vi.waitFor(() => {
      const child = document.querySelector('[data-testid="pos-child"]');
      expect(child).not.toBeNull();
      const container = child!.parentElement!;
      // fromCoordToOffset mock은 항상 { x: 100, y: 200 }을 반환
      expect(container.style.left).toBe('100px');
      expect(container.style.top).toBe('200px');
    });

    rerender(
      <Wrapper>
        <CustomOverlay position={{ lat: 38.0, lng: 128.0 }}>
          <span data-testid="pos-child">content</span>
        </CustomOverlay>
      </Wrapper>,
    );

    await vi.waitFor(() => {
      const child = document.querySelector('[data-testid="pos-child"]');
      expect(child).not.toBeNull();
      const container = child!.parentElement!;
      expect(container.style.left).toBe('100px');
      expect(container.style.top).toBe('200px');
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
});
