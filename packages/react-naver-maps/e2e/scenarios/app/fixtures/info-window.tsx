import { INITIAL_CENTER, toCoord } from '../common.js';
import { defineFixture } from '../fixture.js';
import { InfoWindow } from '../target-imports.js';

export type InfoWindowConfig = {
  /** 값이 그대로인 인라인 anchor 로 열린 InfoWindow 를 함께 올린다. */
  infoWindow?: boolean;
  /** 두 번째 InfoWindow 를 다른 자리에 인라인 anchor 로 함께 연다. SDK 는 지도마다 하나만 연다. */
  infoWindow2?: boolean;
};

export const infoWindow = defineFixture<InfoWindowConfig>({
  render: (config, _probe, core) => (
    <>
      {config.infoWindow && (
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
      )}
      {config.infoWindow2 && (
        <InfoWindow
          open
          content="info2"
          anchor={toCoord([INITIAL_CENTER[0] + 0.002, INITIAL_CENTER[1]])}
          onOpen={() => core.calls.push('infoWindow2Open')}
          onClose={() => core.calls.push('infoWindow2Close')}
        />
      )}
    </>
  ),
});
