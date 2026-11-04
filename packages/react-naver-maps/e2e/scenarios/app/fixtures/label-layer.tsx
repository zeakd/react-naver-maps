import { defineFixture } from '../fixture.js';
import { LabelLayer } from '../target-imports.js';

export type LabelLayerConfig = {
  /** LabelLayer 를 올린다. overlaysOnMap 에 'label'. */
  labelLayer?: boolean;
};

export const labelLayer = defineFixture<LabelLayerConfig>({
  render: (config, _probe, core) =>
    config.labelLayer && (
      <LabelLayer
        ref={(o: naver.maps.Layer | null) => core.recordOverlay('label', o)}
      />
    ),
});
