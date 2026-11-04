import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  installSdkFake,
  type FakeKVO,
  type SdkFake,
} from '../../__tests__/sdk-fake.js';

vi.mock('../../hooks/use-navermaps.js', () => ({
  useNavermaps: () => (globalThis as Record<string, any>).naver.maps,
}));

const mockMap = { id: 'mock-map' };
vi.mock('../../hooks/use-map.js', () => ({
  useMap: () => mockMap,
}));

import { GroundOverlay } from '../ground-overlay.js';

let mock: SdkFake;
const bounds = { south: 37.0, west: 126.0, north: 38.0, east: 127.0 };
const overlays = () => mock.instances.filter((i) => i.type === 'GroundOverlay');

describe('GroundOverlay 스펙 테스트', () => {
  beforeEach(() => {
    mock = installSdkFake();
  });
  afterEach(() => mock.uninstall());

  test('마운트 시 GroundOverlay 인스턴스 생성', () => {
    render(
      <GroundOverlay url="https://example.com/image.png" bounds={bounds} />,
    );

    expect(overlays()).toHaveLength(1);
    expect(overlays()[0]!.instance.get('url')).toBe(
      'https://example.com/image.png',
    );
    expect(overlays()[0]!.instance.getMap()).toBe(mockMap);
  });

  test('url 변경 시 기존 인스턴스를 떼고 새 인스턴스를 만든다', () => {
    const { rerender } = render(
      <GroundOverlay url="https://example.com/image1.png" bounds={bounds} />,
    );
    const first = overlays()[0]!.instance;

    rerender(
      <GroundOverlay url="https://example.com/image2.png" bounds={bounds} />,
    );

    expect(first.getMap()).toBeNull();
    expect(overlays()).toHaveLength(2);
    expect(overlays()[1]!.instance.get('url')).toBe(
      'https://example.com/image2.png',
    );
    expect(overlays()[1]!.instance.getMap()).toBe(mockMap);
  });

  test('bounds 변경 시 인스턴스 재생성', () => {
    const bounds2 = { south: 36.0, west: 125.0, north: 37.0, east: 126.0 };
    const { rerender } = render(
      <GroundOverlay url="https://example.com/image.png" bounds={bounds} />,
    );
    const first = overlays()[0]!.instance;

    rerender(
      <GroundOverlay url="https://example.com/image.png" bounds={bounds2} />,
    );

    expect(overlays()).toHaveLength(2);
    expect(first.getMap()).toBeNull();
  });

  test('opacity 변경은 같은 인스턴스에 쓴다', () => {
    const { rerender } = render(
      <GroundOverlay
        url="https://example.com/image.png"
        bounds={bounds}
        opacity={1}
      />,
    );

    rerender(
      <GroundOverlay
        url="https://example.com/image.png"
        bounds={bounds}
        opacity={0.5}
      />,
    );

    expect(overlays()).toHaveLength(1);
    expect(overlays()[0]!.instance.get('opacity')).toBe(0.5);
  });

  test('unmount 시 지도에서 떼고 리스너를 남기지 않는다', () => {
    const { unmount } = render(
      <GroundOverlay
        url="https://example.com/image.png"
        bounds={bounds}
        onClick={vi.fn()}
      />,
    );
    const instance = overlays()[0]!.instance;
    expect(mock.listenerCount(instance, 'click')).toBe(1);

    unmount();

    expect(instance.getMap()).toBeNull();
    expect(mock.listenerCount(instance, 'click')).toBe(0);
  });

  test('onClick 은 click 이벤트 때 불린다', () => {
    const onClick = vi.fn();
    render(
      <GroundOverlay
        url="https://example.com/image.png"
        bounds={bounds}
        onClick={onClick}
      />,
    );

    const instance = overlays()[0]!.instance as FakeKVO;
    mock.fire(instance, 'click', 'e1');
    expect(onClick).toHaveBeenCalledExactlyOnceWith('e1');
  });

  // SDK 가 GroundOverlay 의 연속 클릭을 dblclick 으로 발화하므로(SDK 3.10.5),
  // onDblclick은 실제로 바인딩되어야 한다. 타입 축소 라운드에서 잘못 제거됐던 회귀를 잡는다.
  test('SDK가 발화하는 5종 이벤트(click/dblclick/mousedown/mouseup/rightclick) 모두 바인딩', () => {
    const handlers = {
      onClick: vi.fn(),
      onDblclick: vi.fn(),
      onMousedown: vi.fn(),
      onMouseup: vi.fn(),
      onRightclick: vi.fn(),
    };
    render(
      <GroundOverlay
        url="https://example.com/image.png"
        bounds={bounds}
        {...handlers}
      />,
    );

    const instance = overlays()[0]!.instance;
    for (const [event, prop] of [
      ['click', 'onClick'],
      ['dblclick', 'onDblclick'],
      ['mousedown', 'onMousedown'],
      ['mouseup', 'onMouseup'],
      ['rightclick', 'onRightclick'],
    ] as const) {
      mock.fire(instance, event);
      expect(handlers[prop], `${event} 리스너 누락`).toHaveBeenCalledTimes(1);
    }
  });
});
