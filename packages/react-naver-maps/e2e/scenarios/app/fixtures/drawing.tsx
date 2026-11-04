import { Activity } from '../activity.js';
import { defineFixture } from '../fixture.js';
import { DrawingManager } from '../target-imports.js';

export type DrawingConfig = {
  /** DrawingManager 를 이 drawingMode 로 올린다. submodules 에 'drawing' 이 있어야 한다. */
  drawingMode?: number;
  /** DrawingManager 를 Activity 로 감싼다. drawingMode 가 있어야 한다. */
  drawingActivity?: 'visible' | 'hidden';
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
        <Activity mode={config.drawingActivity ?? 'visible'}>
          <DrawingManager
            ref={(o: naver.maps.drawing.DrawingManager | null) => {
              if (o) probe.manager = o;
            }}
            drawingMode={config.drawingMode as naver.maps.drawing.DrawingMode}
            onDrawingAdded={() => {
              probe.added += 1;
            }}
          />
        </Activity>
      ),
    fields: { drawings: 'behavior', drawingAdded: 'behavior' },
    read: (_map, probe) => ({
      drawings: probe.manager
        ? Object.keys(probe.manager.getDrawings() ?? {}).length
        : null,
      drawingAdded: probe.added,
    }),
  },
);
