import { act, render } from '@testing-library/react';
import { useLayoutEffect, useState } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  installSdkFake,
  type SdkFake,
  FakeKVO,
} from '../../__tests__/sdk-fake.js';

let navermaps: Record<string, unknown> = {};
vi.mock('../../hooks/use-navermaps.js', () => ({
  useNavermaps: () => navermaps,
}));

import { Panorama } from '../index.js';
import { Container } from '../../map/container.js';
import { Marker } from '../../overlays/marker.js';
import { Circle } from '../../shapes/circle.js';

class MockPanorama extends FakeKVO {
  static last: MockPanorama | null = null;
  el: HTMLElement;
  constructor(el: HTMLElement, options: Record<string, unknown>) {
    super(options);
    this.el = el;
    MockPanorama.last = this;
  }
  getElement() {
    return this.el;
  }
  setSize() {}
  getPanoId() {
    return 'p';
  }
  getPov() {
    return { pan: 0, tilt: 0, fov: 100 };
  }
  setPov(pov: unknown) {
    this.set('pov', pov);
  }
}

let mock: SdkFake;

describe('Panorama 자식 오버레이', () => {
  beforeEach(() => {
    mock = installSdkFake();
    navermaps = { ...mock.maps, Panorama: MockPanorama };
  });
  afterEach(() => mock.uninstall());

  test('Marker 는 거리뷰 init 뒤에 거리뷰에 붙는다', async () => {
    render(
      <Container>
        <Panorama position={{ lat: 37.5, lng: 127 }}>
          <Marker position={{ lat: 37.5, lng: 127 }} />
        </Panorama>
      </Container>,
    );
    await vi.waitFor(() => expect(mock.last('Marker')).toBeDefined());
    const record = mock.last('Marker')!;
    const marker = record.instance as FakeKVO;
    expect(record.options).not.toHaveProperty('map');
    expect(marker.get('map')).toBeUndefined();
    act(() => mock.fire(MockPanorama.last!, 'init'));
    expect(marker.get('map')).toBe(MockPanorama.last);
  });

  test('거리뷰에 붙지 않는 오버레이는 알린다', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      render(
        <Container>
          <Panorama position={{ lat: 37.5, lng: 127 }}>
            <Circle center={{ lat: 37.5, lng: 127 }} radius={10} />
          </Panorama>
        </Container>,
      ),
    ).toThrow(/Panorama 안에서 쓸 수 없습니다/);
  });

  test('거리뷰를 누르고 있는 동안 pov prop 을 보류하고 뗀 뒤 맞춘다', () => {
    const view = (pan: number) => (
      <Container>
        <Panorama
          position={{ lat: 37.5, lng: 127 }}
          pov={{ pan, tilt: 0, fov: 100 }}
        />
      </Container>
    );
    const { rerender } = render(view(0));
    const pano = MockPanorama.last!;
    const setPov = vi.spyOn(pano, 'setPov');
    pano
      .getElement()
      .dispatchEvent(new Event('pointerdown', { bubbles: true }));
    rerender(view(30));
    expect(setPov).not.toHaveBeenCalled();
    act(() => {
      window.dispatchEvent(new Event('pointerup'));
    });
    expect(setPov).toHaveBeenCalledTimes(1);
    expect(setPov).toHaveBeenLastCalledWith({ pan: 30, tilt: 0, fov: 100 });
  });
  test('생성 뒤 첫 동기화 전에 바뀐 pov 를 넣는다', () => {
    function Changing() {
      const [pan, setPan] = useState(0);
      // 화면을 재서 prop 을 정하는 앱처럼 일부러 layout effect 에서 바꾼다.
      // oxlint-disable-next-line react/set-state-in-effect
      useLayoutEffect(() => setPan(90), []);
      return (
        <Container>
          <Panorama
            position={{ lat: 37.5, lng: 127 }}
            pov={{ pan, tilt: 0, fov: 100 }}
          />
        </Container>
      );
    }
    render(<Changing />);
    expect(MockPanorama.last!.get('pov')).toEqual({
      pan: 90,
      tilt: 0,
      fov: 100,
    });
  });

  test('두 손가락 중 하나만 떼면 아직 보류한다', () => {
    const view = (pan: number) => (
      <Container>
        <Panorama
          position={{ lat: 37.5, lng: 127 }}
          pov={{ pan, tilt: 0, fov: 100 }}
        />
      </Container>
    );
    const { rerender } = render(view(0));
    const pano = MockPanorama.last!;
    const setPov = vi.spyOn(pano, 'setPov');
    const pointer = (type: string, pointerId: number) =>
      Object.assign(new Event(type, { bubbles: true }), { pointerId });
    pano.getElement().dispatchEvent(pointer('pointerdown', 2));
    pano.getElement().dispatchEvent(pointer('pointerdown', 3));
    rerender(view(30));
    act(() => {
      window.dispatchEvent(pointer('pointerup', 3));
    });
    expect(setPov).not.toHaveBeenCalled();
    act(() => {
      window.dispatchEvent(pointer('pointerup', 2));
    });
    expect(setPov).toHaveBeenCalledTimes(1);
    expect(setPov).toHaveBeenLastCalledWith({ pan: 30, tilt: 0, fov: 100 });
  });
});
