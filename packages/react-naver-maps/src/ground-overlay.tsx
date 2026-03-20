'use client';

import type { Ref } from 'react';
import {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useNavermaps } from './hooks/use-navermaps.js';
import { useMap } from './hooks/use-map.js';
import { useControlledKVO } from './hooks/use-controlled-kvo.js';
import { omitUndefined } from './utils/omit-undefined.js';
import type {
  EventHandlerProps,
  GroundOverlayEvent,
} from './types/overlay-events.js';

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
}

export function GroundOverlay({ ref, ...props }: GroundOverlayProps) {
  const navermaps = useNavermaps();
  const map = useMap();
  const [overlay, setOverlay] = useState<naver.maps.GroundOverlay | null>(null);
  const overlayRef = useRef<naver.maps.GroundOverlay | null>(null);

  // url/bounds 변경 시 인스턴스 재생성
  useLayoutEffect(() => {
    const instance = new navermaps.GroundOverlay(
      props.url,
      props.bounds,
      omitUndefined({
        map,
        opacity: props.opacity,
        clickable: props.clickable,
      }),
    );
    overlayRef.current = instance;
    setOverlay(instance);

    return () => {
      naver.maps?.Event?.clearInstanceListeners(instance);
      instance.setMap(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.url, props.bounds]);

  useImperativeHandle(ref, () => overlayRef.current!);

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

  // UI events — 맵 이벤트 시스템에서 Shape와 동일한 마우스 이벤트를 지원
  useEffect(() => {
    const listeners: naver.maps.MapEventListener[] = [];
    if (props.onClick)
      listeners.push(
        naver.maps.Event.addListener(overlay, 'click', props.onClick),
      );
    if (props.onDblclick)
      listeners.push(
        naver.maps.Event.addListener(overlay, 'dblclick', props.onDblclick),
      );
    if (props.onMousedown)
      listeners.push(
        naver.maps.Event.addListener(overlay, 'mousedown', props.onMousedown),
      );
    if (props.onMouseup)
      listeners.push(
        naver.maps.Event.addListener(overlay, 'mouseup', props.onMouseup),
      );
    if (props.onMouseover)
      listeners.push(
        naver.maps.Event.addListener(overlay, 'mouseover', props.onMouseover),
      );
    if (props.onMouseout)
      listeners.push(
        naver.maps.Event.addListener(overlay, 'mouseout', props.onMouseout),
      );
    if (props.onMousemove)
      listeners.push(
        naver.maps.Event.addListener(overlay, 'mousemove', props.onMousemove),
      );
    if (props.onRightclick)
      listeners.push(
        naver.maps.Event.addListener(overlay, 'rightclick', props.onRightclick),
      );
    return () => {
      listeners.forEach((l) => naver.maps.Event.removeListener(l));
    };
  }, [
    overlay,
    props.onClick,
    props.onDblclick,
    props.onMousedown,
    props.onMouseup,
    props.onMouseover,
    props.onMouseout,
    props.onMousemove,
    props.onRightclick,
  ]);

  return null;
}
