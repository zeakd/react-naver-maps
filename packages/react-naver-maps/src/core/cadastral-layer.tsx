'use client';

import type { Ref } from 'react';
import { useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { useNavermaps } from './hooks/use-navermaps.js';
import { useMap } from './hooks/use-map.js';
import { sdkAlive, clearMapListeners } from './utils/sdk.js';

/** 지적도 레이어를 지도 위에 표시한다. */
export interface CadastralLayerProps {
  ref?: Ref<naver.maps.CadastralLayer>;
}

export function CadastralLayer({ ref }: CadastralLayerProps) {
  const navermaps = useNavermaps();
  const map = useMap();
  const layerRef = useRef<naver.maps.CadastralLayer | null>(null);

  useLayoutEffect(() => {
    if (!sdkAlive()) return;
    const layer = new navermaps.CadastralLayer();
    layer.setMap(map);
    layerRef.current = layer;
    return () => {
      if (!sdkAlive()) return;
      clearMapListeners(layer);
      layer.setMap(null);
    };
  }, [navermaps, map]);

  useImperativeHandle(ref, () => layerRef.current!);

  return null;
}
