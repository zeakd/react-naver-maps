import { INITIAL_CENTER, toCoord } from '../common.js';
import { defineFixture } from '../fixture.js';
import { InfoWindow } from '../target-imports.js';

export type InfoWindowConfig = {
  /** 값이 그대로인 인라인 anchor 로 열린 InfoWindow 를 함께 올린다. */
  infoWindow?: boolean;
};

export const infoWindow = defineFixture<InfoWindowConfig>({
  render: (config, _probe, core) =>
    config.infoWindow && (
      <InfoWindow
        ref={(o: naver.maps.InfoWindow | null) =>
          core.recordOverlay('infoWindow', o)
        }
        open
        content="info"
        anchor={toCoord(INITIAL_CENTER)}
        onOpen={() => core.calls.push('infoWindowOpen')}
        onClose={() => core.calls.push('infoWindowClose')}
      />
    ),
});
