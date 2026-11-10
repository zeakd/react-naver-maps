'use client';

import { useDataFeatures } from './data-features.js';
import type { DataFeaturesProps } from './data-features.js';

export { DATA_EVENTS } from './data-features.js';
export type {
  DataEvent,
  DataPointerEvent,
  DataPropertyEvent,
  GeoJsonStyle,
} from './data-features.js';

/**
 * GeoJSON 을 지도의 데이터 레이어(`map.data`)에 올린다. SDK 의 `Data.addGeoJson` 이다.
 *
 * ```tsx
 * <NaverMap>
 *   <GeoJson
 *     data={regions}
 *     style={(feature) => ({ fillColor: feature.getProperty('color') })}
 *     onClick={(e) => select(e.feature.getProperty('id'))}
 *   />
 * </NaverMap>
 * ```
 *
 * style·이벤트 규칙은 {@link DataFeaturesProps}.
 */
export type GeoJsonProps = DataFeaturesProps & {
  /** 올릴 GeoJSON. 값이 바뀌면 이전 feature를 빼고 새로 올린다(값으로 비교). */
  data: naver.maps.GeoJSON;
};

export function GeoJson(props: GeoJsonProps) {
  const { data } = props;
  useDataFeatures(
    props,
    data,
    // 타입은 void 지만 SDK 는 올린 feature 배열을 돌려준다(3.10.5).
    (layer, autoStyle) =>
      layer.addGeoJson(data, autoStyle) as unknown as naver.maps.Feature[],
  );
  return null;
}
