'use client';

import { useEffect } from 'react';

/**
 * 지도(또는 거리뷰) element 의 크기가 바뀌면 크기를 맞춘다.
 *
 * SDK 지도는 window resize 만 듣는다. 패널을 접거나 레이아웃이 바뀌어 지도 영역만 달라지면
 * 지도가 따라가지 않으므로 ResizeObserver 로 보고 map.autoResize() 를 부른다.
 * 거리뷰(Panorama)는 window resize 도 듣지 않고 autoResize 도 없어 element 크기로 setSize 한다.
 */
export function useAutoResize(
  target: naver.maps.Map | naver.maps.Panorama | null,
): void {
  useEffect(() => {
    if (!target) return;
    const element = target.getElement();
    const resize =
      'autoResize' in target
        ? () => target.autoResize()
        : () =>
            target.setSize(
              new naver.maps.Size(element.clientWidth, element.clientHeight),
            );
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [target]);
}
