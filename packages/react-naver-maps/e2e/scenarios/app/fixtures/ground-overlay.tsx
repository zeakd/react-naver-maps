import { defineFixture } from '../fixture.js';
import { GroundOverlay } from '../target-imports.js';

export type GroundOverlayConfig = {
  /** GroundOverlay 를 이 url 로 올린다. bounds 는 렌더마다 새로 만든 같은 값이다. */
  groundOverlayUrl?: string;
};

export type GroundOverlayFrame = {
  /** 지금까지 만들어진 GroundOverlay 인스턴스 수 */
  groundOverlays: number;
};

export const groundOverlay = defineFixture<
  GroundOverlayConfig,
  { created: Set<unknown> },
  GroundOverlayFrame
>({
  probe: () => ({ created: new Set() }),
  render: (config, probe) =>
    config.groundOverlayUrl && (
      <GroundOverlay
        ref={(o: naver.maps.GroundOverlay | null) => {
          if (o) probe.created.add(o);
        }}
        url={config.groundOverlayUrl}
        bounds={{ south: 37.56, west: 126.97, north: 37.57, east: 126.99 }}
      />
    ),
  fields: { groundOverlays: 'behavior' },
  read: (_map, probe) => ({ groundOverlays: probe.created.size }),
});
