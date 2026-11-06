'use client';

import { useDataFeatures } from './data-features.js';
import type { DataFeaturesProps } from './data-features.js';

/**
 * KML 문서를 지도의 데이터 레이어(`map.data`)에 올린다. SDK 의 `Data.addKml` 이다.
 *
 * ```tsx
 * const doc = new DOMParser().parseFromString(kmlText, 'text/xml');
 * <NaverMap><Kml data={doc} onClick={(e) => select(e.feature)} /></NaverMap>
 * ```
 *
 * SDK 가 `Document` 만 받으므로 문자열 XML 은 받지 않는다. 같은 `Document` 면 다시 올리지 않는다.
 * style·이벤트 규칙은 {@link DataFeaturesProps}.
 */
export type KmlProps = DataFeaturesProps & {
  /** 올릴 KML 문서. 참조가 바뀌면 이전 feature 를 빼고 새로 올린다. */
  data: Document;
};

export function Kml(props: KmlProps) {
  const { data } = props;
  useDataFeatures(
    props,
    data,
    // @types 3.10.0 의 addKml 은 인자가 KML 타입이고 반환이 void. SDK 는 Feature[] 를 돌려준다(3.10.5).
    (layer, autoStyle) =>
      (
        layer as unknown as {
          addKml(doc: Document, autoStyle: boolean): naver.maps.Feature[];
        }
      ).addKml(data, autoStyle),
  );
  return null;
}
