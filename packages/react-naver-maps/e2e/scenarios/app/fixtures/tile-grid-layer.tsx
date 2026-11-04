import { defineFixture } from '../fixture.js';
import { Layer } from '../target-imports.js';

export type TileGridLayerConfig = {
  /** 타일 경계를 그리는 사용자 MapType 으로 Layer 를 올린다. overlaysOnMap 에 'tileGrid'. 값은 zIndex. */
  tileGridZIndex?: number;
};

export type TileGridLayerFrame = {
  /** 지금까지 만들어진 Layer 인스턴스 수 */
  layersCreated: number;
  /** 문서에 있는 tileGrid 타일 div 수 */
  tileGridCells: number;
};

// 타일마다 테두리 div 를 그리는 지도 유형. 한 번만 만든다.
let tileGrid: naver.maps.MapType | null = null;
function tileGridType(): naver.maps.MapType {
  tileGrid ??= {
    name: 'TileGrid',
    minZoom: 0,
    maxZoom: 22,
    tileSize: new naver.maps.Size(256, 256),
    projection: naver.maps.EPSG3857,
    repeatX: true,
    getTile: () => {
      const el = document.createElement('div');
      el.className = 'tile-grid';
      el.style.cssText =
        'width:256px;height:256px;border:1px solid red;box-sizing:border-box';
      return el;
    },
  } as unknown as naver.maps.MapType;
  return tileGrid;
}

export const tileGridLayer = defineFixture<
  TileGridLayerConfig,
  { layers: Set<unknown> },
  TileGridLayerFrame
>({
  probe: () => ({ layers: new Set() }),
  render: (config, probe, core) =>
    config.tileGridZIndex !== undefined && (
      <Layer
        ref={(o: naver.maps.Layer | null) => {
          core.recordOverlay('tileGrid', o);
          if (o) probe.layers.add(o);
        }}
        name="tileGrid"
        mapTypes={tileGridType()}
        zIndex={config.tileGridZIndex}
      />
    ),
  read: (_map, probe) => ({
    layersCreated: probe.layers.size,
    tileGridCells: document.querySelectorAll('.tile-grid').length,
  }),
});
