import { use } from 'react';
import { NaverMapContext } from '../contexts/naver-map.js';

/** 현재 NaverMap 인스턴스를 반환한다. NaverMap 내부에서 사용. */
export function useMap(): naver.maps.Map {
  const map = use(NaverMapContext);
  if (!map) {
    throw new Error('useMap must be used within <NaverMap>');
  }
  return map;
}
