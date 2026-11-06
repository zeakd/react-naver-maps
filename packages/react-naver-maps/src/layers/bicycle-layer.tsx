'use client';

import type { Ref } from 'react';
import { useImperativeHandle } from 'react';
import { useNavermaps } from '../hooks/use-navermaps.js';
import { useMap } from '../hooks/use-map.js';
import { useStyleMapLayerWarning } from './use-style-map-layer-warning.js';
import { onMap, useSdkInstance } from '../binding/lifetime.js';

/** 자전거 도로 레이어를 지도 위에 표시한다. */
export interface BicycleLayerProps {
  ref?: Ref<naver.maps.BicycleLayer>;
}

export function BicycleLayer({ ref }: BicycleLayerProps) {
  const navermaps = useNavermaps();
  const map = useMap();
  useStyleMapLayerWarning(map, 'BicycleLayer');
  const layer = useSdkInstance(
    onMap(map, () => {
      const instance = new navermaps.BicycleLayer();
      instance.setMap(map);
      return instance;
    }),
    [map],
  );

  useImperativeHandle(ref, () => layer!, [layer]);

  return null;
}
