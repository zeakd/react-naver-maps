import { defineFixture } from '../fixture.js';
import { DotMap, HeatMap } from '../target-imports.js';

export type VisualizationConfig = {
  /** DotMap 을 이 fillColor 로 올린다. submodules 에 'visualization' 이 있어야 한다. overlaysOnMap 에 'dotMap'. */
  dotMapFill?: string;
  /** HeatMap 을 이 opacity 로 올린다. submodules 에 'visualization' 이 있어야 한다. overlaysOnMap 에 'heatMap'. */
  heatMapOpacity?: number;
  /** heatMapOpacity 의 HeatMap 데이터를 { weight, location } 리터럴로 넘긴다. */
  heatMapWeighted?: boolean;
};

export type VisualizationFrame = {
  /** HeatMap 이 있으면 그 opacity(SDK 값) */
  heatMapOpacity: number | null;
};

// 지도 중앙 둘레의 점들([경도, 위도]).
const HEAT_POINTS: naver.maps.PointArrayLiteral[] = Array.from(
  { length: 30 },
  (_, i) => [126.9784 + 0.001 * Math.cos(i), 37.5666 + 0.001 * Math.sin(i)],
);

// 같은 점을 공식 튜토리얼의 { weight, location: [경도, 위도] } 모양으로.
const HEAT_WEIGHTED = HEAT_POINTS.map((location) => ({ weight: 3, location }));

export const visualization = defineFixture<
  VisualizationConfig,
  undefined,
  VisualizationFrame
>({
  render: (config, _probe, core) => (
    <>
      {config.dotMapFill && (
        <DotMap
          ref={(o: naver.maps.visualization.DotMap | null) =>
            core.recordOverlay('dotMap', o)
          }
          data={HEAT_POINTS}
          radius={12}
          fillColor={config.dotMapFill}
        />
      )}
      {config.heatMapOpacity !== undefined && (
        <HeatMap
          ref={(o: naver.maps.visualization.HeatMap | null) =>
            core.recordOverlay('heatMap', o)
          }
          data={config.heatMapWeighted ? HEAT_WEIGHTED : HEAT_POINTS}
          opacity={config.heatMapOpacity}
          radius={20}
        />
      )}
    </>
  ),
  fields: { heatMapOpacity: 'behavior' },
  read: (_map, _probe, core) => ({
    heatMapOpacity:
      (
        core.overlays.heatMap as unknown as {
          getOptions?: (k: string) => number;
        }
      )?.getOptions?.('opacity') ?? null,
  }),
});
