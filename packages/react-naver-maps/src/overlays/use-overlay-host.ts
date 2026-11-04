import { use } from 'react';
import { useMap } from '../hooks/use-map.js';
import { PanoramaHostContext } from './overlay-host-context.js';

/**
 * 오버레이가 붙을 곳. 가장 가까운 NaverMap 이나 Panorama 다.
 * Panorama 와 NaverMap 은 자식에게 서로의 문맥을 비우므로 둘이 겹치지 않는다.
 *
 * `target` 은 SDK 의 setMap·open 에 그대로 넘긴다. SDK 의 Marker, InfoWindow 는 Panorama 도 받는다
 * (공식 튜토리얼 "파노라마에 마커", "파노라마에 정보 창"). @types 3.9.2 는 Map 만 적어 Map 으로 둔다.
 */
export type OverlayHost =
  | { kind: 'map'; target: naver.maps.Map; isReady: () => boolean }
  | { kind: 'panorama'; target: naver.maps.Map; isReady: () => boolean };

export function useOverlayHost(): OverlayHost {
  // Panorama 를 먼저 본다. NaverMap 은 자식에게 Panorama 문맥을 비운다(겹치지 않는다).
  const pano = use(PanoramaHostContext);
  if (pano) {
    return {
      kind: 'panorama',
      target: pano.panorama as unknown as naver.maps.Map,
      isReady: pano.isReady,
    };
  }
  // 지도 밖이면 useMap 이 알린다.
  // useMap 은 안에서 use() 만 쓴다. use() 는 조건 뒤에 불러도 된다(React 문서).
  // oxlint-disable-next-line react/hooks
  const map = useMap();
  return {
    kind: 'map',
    target: map,
    isReady: () => !!(map as naver.maps.Map & { isReady?: boolean }).isReady,
  };
}
