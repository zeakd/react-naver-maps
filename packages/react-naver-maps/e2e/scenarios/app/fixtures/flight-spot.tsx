import { defineFixture } from '../fixture.js';
import { FlightSpot } from '../target-imports.js';

export type FlightSpotConfig = {
  /** FlightSpot 을 올린다. submodules 에 'panorama' 가 있어야 한다. overlaysOnMap 에 'flightSpot'. */
  flightSpot?: boolean;
};

export const flightSpot = defineFixture<FlightSpotConfig>({
  render: (config, _probe, core) =>
    config.flightSpot && (
      <FlightSpot
        ref={(o: naver.maps.FlightSpot | null) =>
          core.recordOverlay(
            'flightSpot',
            o as unknown as { getMap(): unknown },
          )
        }
      />
    ),
});
