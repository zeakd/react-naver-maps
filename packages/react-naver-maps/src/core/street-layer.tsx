'use client';

import type { Ref } from 'react';
import { useImperativeHandle } from 'react';
import { useNavermaps } from './hooks/use-navermaps.js';
import { useMap } from './hooks/use-map.js';
import { onMap, useSdkInstance } from './lifetime.js';

/** 거리뷰 레이어를 지도 위에 표시한다. */
export interface StreetLayerProps {
  ref?: Ref<naver.maps.StreetLayer>;
}

export function StreetLayer({ ref }: StreetLayerProps) {
  const navermaps = useNavermaps();
  const map = useMap();
  const layer = useSdkInstance(
    onMap(map, () => {
      const instance = new navermaps.StreetLayer();
      instance.setMap(map);
      return instance;
    }),
    [map],
  );

  useImperativeHandle(ref, () => layer!, [layer]);

  return null;
}
