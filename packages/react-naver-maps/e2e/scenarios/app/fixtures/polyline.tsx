import { defineFixture } from '../fixture.js';
import { observe } from '../observe.js';
import { Polyline } from '../target-imports.js';

const OBSERVED_SHAPE_METHODS = ['setPath', 'setOptions'];

export type PolylineConfig = {
  /** 값이 그대로인 path 로 Polyline 을 함께 올린다. */
  polyline?: boolean;
  /** polyline 의 path 를 렌더마다 새 배열(같은 좌표)로 넘긴다. */
  polylineInline?: boolean;
};

const STABLE_PATH = [
  { lat: 37.56, lng: 126.97 },
  { lat: 37.57, lng: 126.98 },
];

export const polyline = defineFixture<PolylineConfig>({
  setup: (maps, _probe, core) =>
    observe(maps.Polyline.prototype, OBSERVED_SHAPE_METHODS, core.calls),
  render: (config, _probe, core) =>
    config.polyline && (
      <Polyline
        ref={(o: naver.maps.Polyline | null) =>
          core.recordOverlay('polyline', o)
        }
        path={
          config.polylineInline
            ? STABLE_PATH.map((p) => ({ ...p }))
            : STABLE_PATH
        }
      />
    ),
});
