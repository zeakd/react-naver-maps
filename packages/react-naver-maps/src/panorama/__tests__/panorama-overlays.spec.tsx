import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  installSdkFake,
  type SdkFake,
  FakeKVO,
} from '../../__tests__/sdk-fake.js';

let navermaps: Record<string, unknown> = {};
vi.mock('../../core/hooks/use-navermaps.js', () => ({
  useNavermaps: () => navermaps,
}));

import { Panorama } from '../index.js';
import { Container } from '../../core/container.js';
import { Marker } from '../../core/marker.js';
import { Circle } from '../../core/circle.js';

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
});
