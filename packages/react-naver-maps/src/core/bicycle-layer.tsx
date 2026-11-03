'use client';

import type { Ref } from 'react';
import { useImperativeHandle } from 'react';
import { useNavermaps } from './hooks/use-navermaps.js';
import { useMap } from './hooks/use-map.js';
import { onMap, useSdkInstance } from './lifetime.js';

/** 자전거 도로 레이어를 지도 위에 표시한다. */
export interface BicycleLayerProps {
  ref?: Ref<naver.maps.Layer>;
}

export function BicycleLayer({ ref }: BicycleLayerProps) {
  const navermaps = useNavermaps();
  const map = useMap();
  const layer = useSdkInstance(
    onMap(map, () => {
      // @types/navermaps(3.9.2)에 BicycleLayer 가 없다. SDK 와 공식 문서에는 있다(Layer 를 상속).
      const { BicycleLayer: Bicycle } = navermaps as unknown as {
        BicycleLayer: new () => naver.maps.Layer;
      };
      const instance = new Bicycle();
      instance.setMap(map);
      return instance;
    }),
    [map],
  );

  useImperativeHandle(ref, () => layer!, [layer]);

  return null;
}
