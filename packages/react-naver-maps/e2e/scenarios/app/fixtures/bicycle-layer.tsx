import { defineFixture } from '../fixture.js';
import { BicycleLayer } from '../target-imports.js';

export type BicycleLayerConfig = {
  /** BicycleLayer 를 올린다. overlaysOnMap 에 'bicycle' 로 나온다. */
  bicycleLayer?: boolean;
};

export const bicycleLayer = defineFixture<BicycleLayerConfig>({
  render: (config, _probe, core) =>
    config.bicycleLayer && (
      <BicycleLayer
        ref={(o: naver.maps.Layer | null) => core.recordOverlay('bicycle', o)}
      />
    ),
});
