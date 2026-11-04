import { useEffect } from 'react';
import { isDev } from '../binding/use-static-prop.js';

/**
 * Style Editor 로 만든 지도(`customStyleId`)에서는 기본 지도 유형과 내장 레이어를 쓸 수 없다
 * (공식 문서 "Style Editor 연동하기"). 그 지도에 내장 레이어를 올리면 개발 모드에서 알린다.
 */
export function useStyleMapLayerWarning(map: naver.maps.Map, layer: string) {
  useEffect(() => {
    if (!isDev) return;
    const options = map as unknown as { getOptions?: (key: string) => unknown };
    if (options.getOptions?.('customStyleId')) {
      // eslint-disable-next-line no-console
      console.warn(
        `[react-naver-maps] ${layer} 는 customStyleId(Style Editor) 지도에서 나오지 않는다(공식 문서 "Style Editor 연동하기").`,
      );
    }
  }, [map, layer]);
}
