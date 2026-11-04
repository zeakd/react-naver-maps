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
import { useOverlayHost } from './hooks/use-overlay-host.js';
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
import { useOverlayEvents } from './overlay-spec.js';
import { changedProp } from './types/overlay-events.js';
import type { ChangeHandlerProps } from './types/overlay-events.js';

/**
 * 네이버맵 InfoWindow를 선언적으로 제어한다.
 *
 * ## 네이티브 API 충실 원칙
 *
 * content는 SDK 와 같이 HTML 문자열 또는 HTML 요소다. 네이버맵 InfoWindow는 내부적으로
 * content를 파싱하여 사이즈 계산, autoPan, DOM 구조를 결정한다.
 * ReactNode를 Portal로 주입하면 이 파이프라인을 우회하게 되어
 * 네이티브 동작(사이즈 계산, autoPan 등)이 깨질 수 있다. React 로 그리려면 CustomOverlay 를 쓴다.
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
export interface InfoWindowProps extends ChangeHandlerProps<{
  anchorColor: string;
  anchorSize: naver.maps.Size;
  anchorSkew: boolean;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  content: HTMLElement;
  disableAnchor: boolean;
  disableAutoPan: boolean;
  maxWidth: number;
  pixelOffset: naver.maps.Point;
  position: naver.maps.Coord;
  zIndex: number;
}> {
  ref?: Ref<naver.maps.InfoWindow>;
  /** HTML 문자열 또는 HTML 요소. SDK 의 content 파싱을 그대로 쓴다. */
  content: string | HTMLElement;
  /** 위치 (anchor 없을 때) */
  position?: naver.maps.Coord | naver.maps.CoordLiteral;
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
  pixelOffset?: naver.maps.Point | naver.maps.PointLiteral;
  /** 자동 이동(autoPan) 때 지도 가장자리와 띄울 여백. SDK 기본 (20, 20). @types 3.9.2 에 없다. */
  autoPanPadding?: naver.maps.Point | naver.maps.PointLiteral;
  zIndex?: number;
  // 이벤트. SDK 는 열고 닫힌 위치의 포인터 이벤트를 준다.
  onOpen?: (e: naver.maps.PointerEvent) => void;
  onClose?: (e: naver.maps.PointerEvent) => void;
}

const CHANGES = [
  'anchorColor',
  'anchorSize',
  'anchorSkew',
  'backgroundColor',
  'borderColor',
  'borderWidth',
  'content',
  'disableAnchor',
  'disableAutoPan',
  'maxWidth',
  'pixelOffset',
  'position',
  'zIndex',
].map((k) => [`${k}_changed`, changedProp(k)] as const);

export function InfoWindow({ ref, content, open, ...props }: InfoWindowProps) {
  const navermaps = useNavermaps();
  const host = useOverlayHost();
  const map = host.target;

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
          autoPanPadding: props.autoPanPadding,
          zIndex: props.zIndex,
        }) as unknown as naver.maps.InfoWindowOptions,
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
      waitForInit={host.kind === 'panorama' ? host.isReady : undefined}
      content={content}
      open={open}
      {...props}
    />
  );
}

interface InfoWindowInnerProps extends Omit<InfoWindowProps, 'ref'> {
  infoWindow: naver.maps.InfoWindow;
  map: naver.maps.Map;
  /** 거리뷰에서는 준비(init) 뒤에 연다. 준비 판정. */
  waitForInit?: () => boolean;
}

function InfoWindowInner({
  infoWindow,
  map,
  content,
  open,
  waitForInit,
  ...props
}: InfoWindowInnerProps) {
  // 거리뷰(Panorama)는 준비 전에 연 정보 창을 그리지 않는다. 준비되면 다시 렌더해 연다.
  const [ready, setReady] = useState(() => !waitForInit || waitForInit());
  useEffect(() => {
    if (ready || !waitForInit) return;
    const listener = addMapListener(map, 'init', () => setReady(true));
    // 렌더와 이 effect 사이에 init 이 이미 왔으면 리스너가 놓친다.
    if (waitForInit()) queueMicrotask(() => setReady(true));
    return () => removeMapListener(listener);
  }, [map, ready, waitForInit]);
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
    if (open === undefined || !sdkAlive() || !ready) return;
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
  }, [infoWindow, map, open, props.anchor, ready]);

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
    autoPanPadding: props.autoPanPadding,
  });

  useOverlayEvents(infoWindow, props, CHANGES);

  return null;
}
