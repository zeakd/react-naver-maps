'use client';

import type { Ref } from 'react';
import { useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { useNavermaps } from './hooks/use-navermaps.js';
import { useMap } from './hooks/use-map.js';
import { useStaticProp } from './hooks/use-static-prop.js';
import { omitUndefined } from './utils/omit-undefined.js';

/** 실시간 교통 레이어를 지도 위에 표시한다. */
export interface TrafficLayerProps {
  ref?: Ref<naver.maps.TrafficLayer>;
  /** autoRefresh 주기 (ms). 생성자 옵션으로만 전달된다. */
  interval?: number;
  /**
   * true이면 교통 정보를 주기적으로 자동 갱신한다.
   * 주의: `undefined`는 "SDK 기본값에 위임"을 의미하며 명시적 정지가 아니다.
   * 한 번 `true`로 켠 뒤 `undefined`로 바꿔도 자동 갱신은 멈추지 않는다.
   * 정지하려면 명시적으로 `false`를 전달한다.
   */
  autoRefresh?: boolean;
}

export function TrafficLayer({
  ref,
  interval,
  autoRefresh,
}: TrafficLayerProps) {
  const navermaps = useNavermaps();
  const map = useMap();
  const layerRef = useRef<naver.maps.TrafficLayer | null>(null);

  // satisfies로 propName이 keyof TrafficLayerProps에 속함을 컴파일 시점에 강제.
  // 정책: static 호출이 1~2회이면 satisfies, 3회 이상이면 wrapper(useXStatic).
  // 자세한 정책은 naver-map.tsx의 useNaverMapStatic 주석 참고.
  useStaticProp(
    'TrafficLayer',
    'interval' satisfies keyof TrafficLayerProps,
    interval,
  );

  useLayoutEffect(() => {
    const layer = new navermaps.TrafficLayer(omitUndefined({ interval }));
    layer.setMap(map);
    layerRef.current = layer;
    return () => {
      naver.maps.Event.clearInstanceListeners(layer);
      layer.setMap(null);
    };
    // interval은 생성자 옵션으로만 전달되므로 deps에 포함하지 않는다.
    // interval 변경 시 재생성이 필요하면 React key로 제어한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navermaps, map]);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    // prop 미지정 시 SDK 기본값에 맡기고 호출하지 않는다.
    if (autoRefresh === undefined) return;
    if (autoRefresh) {
      layer.startAutoRefresh();
    } else {
      layer.endAutoRefresh();
    }
  }, [autoRefresh]);

  useImperativeHandle(ref, () => layerRef.current!);

  return null;
}
