'use client';

import type { Ref } from 'react';
import { useImperativeHandle } from 'react';
import { useNavermaps } from '../hooks/use-navermaps.js';
import { useMap } from '../hooks/use-map.js';
import { onMap, useSdkInstance } from '../binding/lifetime.js';

/**
 * 지도 글자(주기, 지명) 레이어를 켠다. 네이버 지도의 벡터 일반 지도에 얹는 레이어다.
 *
 * ```tsx
 * <NaverMap mapTypes={vectorMapTypes}>
 *   {showLabel && <LabelLayer />}
 * </NaverMap>
 * ```
 *
 * 켜고 끄는 것은 마운트로 한다. SDK 의 생성자 인자(name, registry)는 3.10.5 의 LabelLayer 가
 * 쓰지 않고 이름은 항상 "label" 이라 prop 으로 받지 않는다. 문서에 옵션 typedef 도 없다.
 */
export interface LabelLayerProps {
  ref?: Ref<naver.maps.LabelLayer>;
}

export function LabelLayer({ ref }: LabelLayerProps) {
  const navermaps = useNavermaps();
  const map = useMap();
  const layer = useSdkInstance(
    onMap(map, () => {
      // @types 3.10.0 는 (name, registry) 를 필수로 요구하나 SDK 3.10.5 는 인자 없이 쓴다
      // (공식 튜토리얼 tutorial-5-label 이 `new naver.maps.LabelLayer()`).
      const { LabelLayer: Label } = navermaps as unknown as {
        LabelLayer: new () => naver.maps.LabelLayer;
      };
      const instance = new Label();
      instance.setMap(map);
      return instance;
    }),
    [map],
  );

  useImperativeHandle(ref, () => layer!, [layer]);

  return null;
}
