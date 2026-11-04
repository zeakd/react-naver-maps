import { defineFixture } from '../fixture.js';
import { DrawingManager } from '../target-imports.js';

export type DrawingConfig = {
  /** DrawingManager 를 이 drawingMode 로 올린다. submodules 에 'drawing' 이 있어야 한다. */
  drawingMode?: number;
};

export type DrawingFrame = {
  /** DrawingManager 가 있으면 그린 도형 수(getDrawings) */
  drawings: number | null;
  /** 이 프레임까지 onDrawingAdded 를 받은 수 */
  drawingAdded: number;
};

type DrawingProbe = {
  manager: naver.maps.drawing.DrawingManager | null;
  added: number;
};

export const drawing = defineFixture<DrawingConfig, DrawingProbe, DrawingFrame>(
  {
    probe: () => ({ manager: null, added: 0 }),
    render: (config, probe) =>
      config.drawingMode !== undefined && (
        <DrawingManager
          ref={(o: naver.maps.drawing.DrawingManager | null) => {
            if (o) probe.manager = o;
          }}
          drawingMode={config.drawingMode as naver.maps.drawing.DrawingMode}
          onDrawingAdded={() => {
            probe.added += 1;
          }}
        />
      ),
    read: (_map, probe) => ({
      drawings: probe.manager
        ? Object.keys(probe.manager.getDrawings() ?? {}).length
        : null,
      drawingAdded: probe.added,
    }),
  },
);
