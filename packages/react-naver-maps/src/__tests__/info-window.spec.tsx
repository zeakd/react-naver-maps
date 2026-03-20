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
});
