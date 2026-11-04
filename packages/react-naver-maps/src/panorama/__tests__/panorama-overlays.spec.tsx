import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createMockNaverMaps,
  MockKVO,
} from '../../core/__tests__/test-utils.js';

let navermaps: Record<string, unknown> = {};
vi.mock('../../core/hooks/use-navermaps.js', () => ({
  useNavermaps: () => navermaps,
}));

import { Panorama } from '../index.js';
import { Container } from '../../core/container.js';
import { Marker } from '../../core/marker.js';
import { Circle } from '../../core/circle.js';

class MockPanorama extends MockKVO {
  static last: MockPanorama | null = null;
  constructor(_el: HTMLElement, options: Record<string, unknown>) {
    super(options);
    MockPanorama.last = this;
  }
  setSize() {}
  getPanoId() {
    return 'p';
  }
  getPov() {
    return { pan: 0, tilt: 0, fov: 100 };
  }
}

let mock: ReturnType<typeof createMockNaverMaps>;

describe('Panorama 자식 오버레이', () => {
  beforeEach(() => {
    mock = createMockNaverMaps();
    navermaps = { ...mock.navermaps, Panorama: MockPanorama };
  });
  afterEach(() => mock.cleanup());

  test('Marker 는 거리뷰 init 뒤에 거리뷰에 붙는다', async () => {
    render(
      <Container>
        <Panorama position={{ lat: 37.5, lng: 127 }}>
          <Marker position={{ lat: 37.5, lng: 127 }} />
        </Panorama>
      </Container>,
    );
    await vi.waitFor(() =>
      expect(mock.getLastInstance('Marker')).toBeDefined(),
    );
    const record = mock.getLastInstance('Marker')!;
    const marker = record.instance as MockKVO;
    expect(record.options).not.toHaveProperty('map');
    expect(marker.get('map')).toBeUndefined();
    act(() => MockPanorama.last!._trigger('init'));
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
});
