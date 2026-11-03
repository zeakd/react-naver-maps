'use client';

import type { Ref } from 'react';
import { useEffect, useImperativeHandle } from 'react';
import { useNavermaps } from './hooks/use-navermaps.js';
import { useMap } from './hooks/use-map.js';
import { useControlledKVO } from './hooks/use-controlled-kvo.js';
import { omitUndefined } from './utils/omit-undefined.js';
import type {
  EventHandlerProps,
  GroundOverlayEvent,
} from './types/overlay-events.js';
import { addMapListener, removeMapListener } from './utils/sdk.js';
import type { MapListener } from './utils/sdk.js';
import { onMap, useSdkInstance } from './lifetime.js';

/**
 * 이미지를 지도 위에 오버레이한다.
 *
 * ## url/bounds 변경 시 인스턴스 재생성
 *
 * 네이버맵 API에 setBounds()가 없다.
 * setUrl()은 존재하지만 내부적으로 KVO set("url")을 호출하지 않아
 * getUrl()과 불일치가 발생하는 불완전한 구현이다.
 *
 * 따라서 url/bounds 모두 변경 시 인스턴스를 재생성한다.
 * useLayoutEffect의 의존성 배열 [url, bounds]로 제어하며,
 * cleanup에서 이전 인스턴스를 확실히 정리한다.
 *
 * ## useOverlay를 쓰지 않는 이유
 *
 * useOverlay는 의존성 배열이 []로 고정(마운트 1회)이다.
 * url/bounds 변경에 의한 재생성이 필요하므로 직접 useLayoutEffect를 사용한다.
 */
export interface GroundOverlayProps extends EventHandlerProps<GroundOverlayEvent> {
  ref?: Ref<naver.maps.GroundOverlay>;
  url: string;
  bounds: naver.maps.LatLngBounds | naver.maps.LatLngBoundsLiteral;
  opacity?: number;
  clickable?: boolean;
  /**
   * 이미지 요청의 CORS 모드. SDK 패턴: controlled (`_crossOrigin_changed` KVO 핸들러).
   * 일반적인 값은 `"anonymous"`, `"use-credentials"`.
   */
  crossOrigin?: string;
}

export function GroundOverlay({ ref, ...props }: GroundOverlayProps) {
  const navermaps = useNavermaps();
  const map = useMap();
  // url/bounds 가 바뀌면 다시 만든다(생성자 인자라 setter 가 없다). 값으로 비교한다.
  const overlay = useSdkInstance(
    onMap(
      map,
      () =>
        new navermaps.GroundOverlay(
          props.url,
          props.bounds,
          omitUndefined({
            map,
            opacity: props.opacity,
            clickable: props.clickable,
            crossOrigin: props.crossOrigin,
          }),
        ),
    ),
    [props.url, props.bounds],
  );

  useImperativeHandle(ref, () => overlay!, [overlay]);

  if (!overlay) return null;

  return <GroundOverlayInner overlay={overlay} {...props} />;
}

interface GroundOverlayInnerProps extends Omit<GroundOverlayProps, 'ref'> {
  overlay: naver.maps.GroundOverlay;
}

function GroundOverlayInner({ overlay, ...props }: GroundOverlayInnerProps) {
  // KVO sync
  useControlledKVO(overlay, 'opacity', props.opacity);
  useControlledKVO(overlay, 'clickable', props.clickable);
  useControlledKVO(overlay, 'crossOrigin', props.crossOrigin);

  // UI events — SDK는 GROUND_DOMEVENTS(click/mousedown/mouseup/contextmenu)를 등록하고,
  // click 리스너가 연속 클릭을 합성 dblclick으로, contextmenu를 rightclick으로 발화한다.
  useEffect(() => {
    const listeners: MapListener[] = [];
    if (props.onClick)
      listeners.push(addMapListener(overlay, 'click', props.onClick));
    if (props.onDblclick)
      listeners.push(addMapListener(overlay, 'dblclick', props.onDblclick));
    if (props.onMousedown)
      listeners.push(addMapListener(overlay, 'mousedown', props.onMousedown));
    if (props.onMouseup)
      listeners.push(addMapListener(overlay, 'mouseup', props.onMouseup));
    if (props.onRightclick)
      listeners.push(addMapListener(overlay, 'rightclick', props.onRightclick));
    return () => {
      listeners.forEach((l) => removeMapListener(l));
    };
  }, [
    overlay,
    props.onClick,
    props.onDblclick,
    props.onMousedown,
    props.onMouseup,
    props.onRightclick,
  ]);

  return null;
}
