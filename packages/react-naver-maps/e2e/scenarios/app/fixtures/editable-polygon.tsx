import type { LL } from '../../types.js';
import { defineFixture } from '../fixture.js';
import { observe } from '../observe.js';
import { Polygon } from '../target-imports.js';

export type EditablePolygonConfig = {
  /** 첫 꼭짓점이 지도 중앙(HOME)인 Polygon 을 defaultPaths 와 editable 로 올린다. submodules 에 'drawing'. */
  editablePolygon?: boolean;
  /**
   * editablePolygon 의 꼭짓점을 내려주는 방식. 기본 default 는 defaultPaths.
   * controlled 는 paths 로 렌더마다 새로 만든 같은 좌표의 배열을 준다. 문서상 지원하지 않는 조합이다
   * (src/shapes/use-editable.ts 의 주석): 편집은 SDK 의 path 배열을 제자리에서 고치고 이벤트를 내지 않아
   * 다음 렌더가 prop 값으로 되돌릴 수 있다. setPaths 호출(calls)로 본다.
   */
  polygonPathsMode?: 'default' | 'controlled';
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
  setup: (maps, _probe, core) =>
    observe(maps.Polygon.prototype, ['setPaths'], core.calls),
  render: (config, probe) =>
    config.editablePolygon && (
      <Polygon
        ref={(o: naver.maps.Polygon | null) => {
          if (o) probe.polygon = o;
        }}
        {...(config.polygonPathsMode === 'controlled'
          ? { paths: EDITABLE_PATHS.map((ring) => ring.map((p) => ({ ...p }))) }
          : { defaultPaths: EDITABLE_PATHS })}
        editable
        fillColor="#f00"
        fillOpacity={0.2}
      />
    ),
  fields: { polygonFirst: 'behavior' },
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
