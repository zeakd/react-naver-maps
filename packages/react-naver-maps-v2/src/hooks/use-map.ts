import { use } from 'react';
import { NaverMapContext } from '../contexts/naver-map.js';

export function useMap(): naver.maps.Map {
  const map = use(NaverMapContext);
  if (!map) {
    throw new Error('useMap must be used within <NaverMap>');
  }
  return map;
}
