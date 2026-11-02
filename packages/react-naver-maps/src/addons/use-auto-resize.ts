'use client';

import { useEffect } from 'react';

/**
 * 지도 element 의 크기가 바뀌면 지도 크기를 맞춘다.
 *
 * SDK 는 window resize 만 듣는다. 패널을 접거나 레이아웃이 바뀌어 지도 영역만 달라지면
 * 지도가 따라가지 않으므로 ResizeObserver 로 보고 map.autoResize() 를 부른다.
 */
export function useAutoResize(map: naver.maps.Map | null): void {
  useEffect(() => {
    if (!map) return;
    const observer = new ResizeObserver(() => map.autoResize());
    observer.observe(map.getElement());
    return () => observer.disconnect();
  }, [map]);
}
