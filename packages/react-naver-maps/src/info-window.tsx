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

/**
 * 네이버맵 InfoWindow를 선언적으로 제어한다.
 *
 * ## 네이티브 API 충실 원칙
 *
 * content는 string만 지원한다. 네이버맵 InfoWindow는 내부적으로
 * content를 파싱하여 사이즈 계산, autoPan, DOM 구조를 결정한다.
 * ReactNode를 Portal로 주입하면 이 파이프라인을 우회하게 되어
 * 네이티브 동작(사이즈 계산, autoPan 등)이 깨질 수 있다.
 *
 * ## open/close 생명주기
 *
 * 네이티브 API에서 open()은 내부적으로 setMap(map)을 호출하고,
 * close()는 setMap(null)을 호출한다.
 * 한 맵에 InfoWindow는 하나만 열린다 — onAdd()에서 기존 InfoWindow를 닫는다.
 *
 * ## UI 마우스 이벤트가 없는 이유
 *
 * InfoWindow는 floatPane에 추가되며, 맵의 이벤트 디스패처는
 * floatPane 내부 요소를 맵 이벤트 대상에서 제외한다.
 * 따라서 click, mousedown 등의 UI 이벤트가 네이버맵 이벤트 시스템으로 전달되지 않는다.
 * 지원 이벤트: open, close, *_changed (KVO)
 *
 * useOverlay를 쓰지 않는 이유:
 * - cleanup이 setMap(null)이 아니라 close() (동일하지만 의미적 구분)
 * - open() 시 anchor 처리, position silent set, autoPan 등 추가 로직
 */
export interface InfoWindowProps {
  ref?: Ref<naver.maps.InfoWindow>;
  /** string content. 네이버맵 네이티브 content 파싱 파이프라인을 그대로 사용한다. */
  content: string;
  /** 위치 (anchor 없을 때) */
  position?: naver.maps.LatLng | naver.maps.LatLngLiteral;
  /** anchor (Marker ref 등). open(map, anchor)로 전달된다. */
  anchor?: naver.maps.Marker | naver.maps.Coord | naver.maps.CoordLiteral;
  /**
   * 열림 상태. 전달 시 선언적 제어, 미전달 시 ref로 직접 open()/close() 호출.
   */
  open?: boolean;
  // 옵션
  maxWidth?: number;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  disableAutoPan?: boolean;
  disableAnchor?: boolean;
  anchorSkew?: boolean;
  anchorSize?: naver.maps.Size | naver.maps.SizeLiteral;
  anchorColor?: string;
  pixelOffset?: naver.maps.Point;
  zIndex?: number;
  // 이벤트
  onOpen?: () => void;
  onClose?: () => void;
}

export function InfoWindow({ ref, content, open, ...props }: InfoWindowProps) {
  const navermaps = useNavermaps();
  const map = useMap();
  const [infoWindow, setInfoWindow] = useState<naver.maps.InfoWindow | null>(
    null,
  );
  const infoWindowRef = useRef<naver.maps.InfoWindow | null>(null);

  useLayoutEffect(() => {
    const instance = new navermaps.InfoWindow(
      omitUndefined({
        content,
        position: props.position,
        maxWidth: props.maxWidth,
        backgroundColor: props.backgroundColor,
        borderColor: props.borderColor,
        borderWidth: props.borderWidth,
        disableAutoPan: props.disableAutoPan,
        disableAnchor: props.disableAnchor,
        anchorSkew: props.anchorSkew,
        anchorSize: props.anchorSize,
        anchorColor: props.anchorColor,
        pixelOffset: props.pixelOffset,
        zIndex: props.zIndex,
      }),
    );
    infoWindowRef.current = instance;
    setInfoWindow(instance);

    return () => {
      instance.close();
      naver.maps?.Event?.clearInstanceListeners(instance);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => infoWindowRef.current!);

  if (!infoWindow) return null;

  return (
    <InfoWindowInner
      infoWindow={infoWindow}
      map={map}
      content={content}
      open={open}
      {...props}
    />
  );
}

interface InfoWindowInnerProps extends Omit<InfoWindowProps, 'ref'> {
  infoWindow: naver.maps.InfoWindow;
  map: naver.maps.Map;
}

function InfoWindowInner({
  infoWindow,
  map,
  content,
  open,
  ...props
}: InfoWindowInnerProps) {
  // open/close 상태 동기화 — open이 undefined이면 skip (ref로 직접 제어)
  useEffect(() => {
    if (open === undefined) return;
    if (open) {
      if (props.anchor) {
        infoWindow.open(map, props.anchor);
      } else {
        infoWindow.open(map);
      }
    } else {
      infoWindow.close();
    }
  }, [infoWindow, map, open, props.anchor]);

  // content 변경 시 네이티브 setContent 호출
  useEffect(() => {
    infoWindow.setContent(content);
  }, [infoWindow, content]);

  // 옵션 변경 시 setOptions
  useEffect(() => {
    infoWindow.setOptions(
      omitUndefined({
        maxWidth: props.maxWidth,
        backgroundColor: props.backgroundColor,
        borderColor: props.borderColor,
        borderWidth: props.borderWidth,
        disableAutoPan: props.disableAutoPan,
        disableAnchor: props.disableAnchor,
        anchorSkew: props.anchorSkew,
        anchorSize: props.anchorSize,
        anchorColor: props.anchorColor,
        pixelOffset: props.pixelOffset,
        zIndex: props.zIndex,
      }) as naver.maps.InfoWindowOptions,
    );
  }, [
    infoWindow,
    props.maxWidth,
    props.backgroundColor,
    props.borderColor,
    props.borderWidth,
    props.disableAutoPan,
    props.disableAnchor,
    props.anchorSkew,
    props.anchorSize,
    props.anchorColor,
    props.pixelOffset,
    props.zIndex,
  ]);

  // position 변경
  useControlledKVO(infoWindow, 'position', props.position);

  // 이벤트: open, close (네이버맵 이벤트 시스템에서 발화하는 이벤트만)
  useEffect(() => {
    const listeners: naver.maps.MapEventListener[] = [];
    if (props.onOpen)
      listeners.push(
        naver.maps.Event.addListener(infoWindow, 'open', props.onOpen),
      );
    if (props.onClose)
      listeners.push(
        naver.maps.Event.addListener(infoWindow, 'close', props.onClose),
      );
    return () => {
      listeners.forEach((l) => naver.maps.Event.removeListener(l));
    };
  }, [infoWindow, props.onOpen, props.onClose]);

  return null;
}
