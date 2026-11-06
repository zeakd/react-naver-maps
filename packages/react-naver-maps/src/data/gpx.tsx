'use client';

import { useDataFeatures } from './data-features.js';
import type { DataFeaturesProps } from './data-features.js';

/**
 * GPX 문서를 지도의 데이터 레이어(`map.data`)에 올린다. SDK 의 `Data.addGpx` 이다.
 *
 * ```tsx
 * const doc = new DOMParser().parseFromString(gpxText, 'text/xml');
 * <NaverMap><Gpx data={doc} onClick={(e) => select(e.feature)} /></NaverMap>
 * ```
 *
 * SDK 가 `Document` 만 받으므로 문자열 XML 은 받지 않는다. 같은 `Document` 면 다시 올리지 않는다.
 * style·이벤트 규칙은 {@link DataFeaturesProps}.
 */
export type GpxProps = DataFeaturesProps & {
  /** 올릴 GPX 문서. 참조가 바뀌면 이전 feature 를 빼고 새로 올린다. */
  data: Document;
};

export function Gpx(props: GpxProps) {
  const { data } = props;
  useDataFeatures(
    props,
    data,
    // @types 3.10.0 의 addGpx 는 인자가 GPX 타입이고 반환이 void. SDK 는 Feature[] 를 돌려준다(3.10.5).
    (layer, autoStyle) =>
      (
        layer as unknown as {
          addGpx(doc: Document, autoStyle: boolean): naver.maps.Feature[];
        }
      ).addGpx(data, autoStyle),
  );
  return null;
}
