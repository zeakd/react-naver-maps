import type { LL } from '../../types.js';
import { defineFixture } from '../fixture.js';
import { Polygon } from '../target-imports.js';

export type EditablePolygonConfig = {
  /** 첫 꼭짓점이 지도 중앙(HOME)인 Polygon 을 defaultPaths 와 editable 로 올린다. submodules 에 'drawing'. */
  editablePolygon?: boolean;
};

export type EditablePolygonFrame = {
  /** editablePolygon 의 첫 꼭짓점. 없으면 null */
  polygonFirst: LL | null;
};

// 첫 꼭짓점이 지도 중앙(INITIAL_CENTER)인 삼각형.
const EDITABLE_PATHS = [
  [
    { lat: 37.5666, lng: 126.9784 },
    { lat: 37.5666, lng: 126.982 },
    { lat: 37.5645, lng: 126.98 },
  ],
];

export const editablePolygon = defineFixture<
  EditablePolygonConfig,
  { polygon: naver.maps.Polygon | null },
  EditablePolygonFrame
>({
  probe: () => ({ polygon: null }),
  render: (config, probe) =>
    config.editablePolygon && (
      <Polygon
        ref={(o: naver.maps.Polygon | null) => {
          if (o) probe.polygon = o;
        }}
        defaultPaths={EDITABLE_PATHS}
        editable
        fillColor="#f00"
        fillOpacity={0.2}
      />
    ),
  read: (_map, probe) => ({
    polygonFirst: probe.polygon
      ? (() => {
          const paths = probe.polygon.getPaths() as unknown as {
            getAt(i: number): { getAt(i: number): naver.maps.LatLng };
          };
          const p = paths.getAt(0).getAt(0);
          return [p.lat(), p.lng()] as LL;
        })()
      : null,
  }),
});
