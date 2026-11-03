'use client';

import type { Ref } from 'react';
import { useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { useNavermaps } from './hooks/use-navermaps.js';
import { useMap } from './hooks/use-map.js';
import { useControlledProps } from './hooks/use-controlled-kvo.js';
import { omitUndefined } from './utils/omit-undefined.js';
import {
  sdkAlive,
  addMapListener,
  removeMapListener,
  clearMapListeners,
} from './utils/sdk.js';
import type { MapListener } from './utils/sdk.js';
import { kvoEquals } from './hooks/use-controlled-kvo.js';
import { useSdkInstance } from './lifetime.js';

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

  // 수명은 lifetime.ts 규칙을 따른다. 숨길 때는 닫고, 다시 보일 때는 open prop 동기화가 다시 연다
  // (InfoWindowInner 의 open effect 가 닫힌 것을 보고 연다).
  const infoWindow = useSdkInstance<naver.maps.InfoWindow>({
    create: () =>
      new navermaps.InfoWindow(
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
      ),
    detach: (instance) => instance.close(),
    dispose: (instance) => {
      instance.close();
      clearMapListeners(instance);
    },
  });

  useImperativeHandle(ref, () => infoWindow!, [infoWindow]);

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
  // 'open'/'close' 이벤트 listener를 useLayoutEffect로 우선 등록 (paint 전).
  // 같은 컴포넌트 내에서 React가 hook 등록 순서를 보장하므로 useEffect로도 timing 자체는
  // 안전하지만(이 컴포넌트는 listener 등록 다음에 open() 호출 useEffect가 따라옴),
  // 향후 코드 변경이나 SDK가 다른 곳에서 동기 발화하는 패턴을 추가했을 때 안전하도록 보수적으로
  // useLayoutEffect 사용. (fix-16, fix-13과 동일한 라이프사이클 이벤트 정책)
  useLayoutEffect(() => {
    const listeners: MapListener[] = [];
    if (props.onOpen)
      listeners.push(addMapListener(infoWindow, 'open', props.onOpen));
    if (props.onClose)
      listeners.push(addMapListener(infoWindow, 'close', props.onClose));
    return () => {
      listeners.forEach((l) => removeMapListener(l));
    };
  }, [infoWindow, props.onOpen, props.onClose]);

  // open/close 상태 동기화 — open이 undefined이면 skip (ref로 직접 제어)
  const openedRef = useRef<{ anchor: unknown } | null>(null);
  useEffect(() => {
    if (open === undefined || !sdkAlive()) return;
    if (open) {
      // 인라인 anchor 는 참조가 매번 달라도 값이 같으면 다시 열지 않는다.
      // open 은 close 와 open 이벤트를 다시 내고 autoPan 도 다시 돈다.
      // 숨겼다 보이면(Activity 등) 닫혀 있으므로 다시 연다.
      const opened = openedRef.current;
      if (
        opened &&
        kvoEquals(opened.anchor, props.anchor) &&
        infoWindow.getMap()
      )
        return;
      if (props.anchor) {
        infoWindow.open(map, props.anchor);
      } else {
        infoWindow.open(map);
      }
      openedRef.current = { anchor: props.anchor };
    } else {
      openedRef.current = null;
      infoWindow.close();
    }
  }, [infoWindow, map, open, props.anchor]);

  // content 변경 시 네이티브 setContent 호출
  useEffect(() => {
    infoWindow.setContent(content);
  }, [infoWindow, content]);

  // 개별 옵션을 useControlledKVO로 처리 — equality 검사 후 변경된 키만 setOptions(key, val).
  // 객체 setOptions(obj) 일괄 호출은 deps 하나만 바뀌어도 모든 키 _changed 발화 + resize/draw → 폭주 위험.
  useControlledProps(infoWindow, {
    position: props.position,
    zIndex: props.zIndex,
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
  });

  return null;
}
