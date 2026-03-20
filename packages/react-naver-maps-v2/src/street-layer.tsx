'use client';

import type { Ref } from 'react';
import { useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { useNavermaps } from './hooks/use-navermaps.js';
import { useMap } from './hooks/use-map.js';

/** 거리뷰 레이어를 지도 위에 표시한다. */
export interface StreetLayerProps {
  ref?: Ref<naver.maps.StreetLayer>;
}

export function StreetLayer({ ref }: StreetLayerProps) {
  const navermaps = useNavermaps();
  const map = useMap();
  const layerRef = useRef<naver.maps.StreetLayer | null>(null);

  useLayoutEffect(() => {
    const layer = new navermaps.StreetLayer();
    layer.setMap(map);
    layerRef.current = layer;
    return () => {
      naver.maps.Event.clearInstanceListeners(layer);
      layer.setMap(null);
    };
  }, [navermaps, map]);

  useImperativeHandle(ref, () => layerRef.current!);

  return null;
}
