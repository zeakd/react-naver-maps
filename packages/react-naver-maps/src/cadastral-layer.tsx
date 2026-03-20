'use client';

import type { Ref } from 'react';
import { useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { useNavermaps } from './hooks/use-navermaps.js';
import { useMap } from './hooks/use-map.js';

/** 지적도 레이어를 지도 위에 표시한다. */
export interface CadastralLayerProps {
  ref?: Ref<naver.maps.CadastralLayer>;
}

export function CadastralLayer({ ref }: CadastralLayerProps) {
  const navermaps = useNavermaps();
  const map = useMap();
  const layerRef = useRef<naver.maps.CadastralLayer | null>(null);

  useLayoutEffect(() => {
    const layer = new navermaps.CadastralLayer();
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
