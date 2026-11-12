import { createContext } from 'react';

/**
 * 오버레이를 붙일 곳이 Panorama(거리뷰)일 때. Panorama 가 자식에게 내려준다.
 * 거리뷰는 준비(init) 전에 붙인 오버레이를 그리지 않아(공식 튜토리얼은 init 뒤 setMap) 준비 여부도 준다.
 * Panorama 인스턴스는 준비 여부를 공개하지 않아 Panorama 컴포넌트가 init 을 듣고 기록한다.
 */
export type PanoramaHost = {
  panorama: naver.maps.Panorama;
  isReady: () => boolean;
};

export const PanoramaHostContext = createContext<PanoramaHost | null>(null);
