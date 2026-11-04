import { INITIAL_CENTER, toCoord } from '../common.js';
import { defineFixture } from '../fixture.js';
import { Circle } from '../target-imports.js';

export type CircleConfig = {
  /** onClick 만 있는 Circle 을 지도 중앙에 올린다. */
  circle?: boolean;
  /** Circle 의 clickable */
  circleClickable?: boolean;
};

export type CircleFrame = {
  /** 이 프레임까지 Circle 이 받은 클릭 수 */
  circleClicks: number;
};

export const circle = defineFixture<
  CircleConfig,
  { clicks: number },
  CircleFrame
>({
  probe: () => ({ clicks: 0 }),
  render: (config, probe, core) =>
    config.circle && (
      <Circle
        ref={(o: naver.maps.Circle | null) => core.recordOverlay('circle', o)}
        center={toCoord(INITIAL_CENTER)}
        radius={300}
        fillColor="#007EEA"
        fillOpacity={0.3}
        clickable={config.circleClickable}
        onClick={() => {
          probe.clicks += 1;
        }}
      />
    ),
  read: (_map, probe) => ({ circleClicks: probe.clicks }),
});
