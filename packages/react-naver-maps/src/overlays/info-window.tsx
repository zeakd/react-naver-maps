'use client';

import type { Ref } from 'react';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useNavermaps } from '../hooks/use-navermaps.js';
import { useOverlayHost } from './use-overlay-host.js';
import { useControlledProps } from '../binding/use-controlled-kvo.js';
import { omitUndefined } from '../binding/omit-undefined.js';
import { pick } from '../binding/pick.js';
import {
  sdkAlive,
  addMapListener,
  removeMapListener,
  clearMapListeners,
} from '../sdk/listeners.js';
import { useStableValue } from '../binding/use-stable-value.js';
import { useSdkInstance } from '../binding/lifetime.js';
import { useOverlayEvents } from './overlay-spec.js';
import { changedProp } from './overlay-events.js';
import type { ChangeHandlerProps } from './overlay-events.js';

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

/**
 * 생성 옵션이자 controlled 로 맞추는 prop. 순서가 생성자에 넘기는 순서다. content 는 setContent 로
 * 따로 맞추고(아래 effect), 열림은 open prop 이 맡는다.
 */
const OPTIONS = [
  'position',
  'maxWidth',
  'backgroundColor',
  'borderColor',
  'borderWidth',
  'disableAutoPan',
  'disableAnchor',
  'anchorSkew',
  'anchorSize',
  'anchorColor',
  'pixelOffset',
  'autoPanPadding',
  'zIndex',
] as const satisfies readonly (keyof InfoWindowProps)[];

/** 열고 닫힘 이벤트. 목록을 상수로 두어 렌더마다 만들지 않는다. */
const OPEN_CLOSE = ['open', 'close'] as const;

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
          ...pick(props, OPTIONS),
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
  // open, close 는 open() 을 부르는 아래 effect 보다 먼저, paint 전에 단다.
  useOverlayEvents(infoWindow, props, OPEN_CLOSE, 'layout');

  // open/close 상태 동기화 — open이 undefined이면 skip (ref로 직접 제어)
  // anchor 는 값으로 안정화한다. 인라인 anchor 는 렌더마다 새 객체라 그대로 deps 에 두면 이 effect 가
  // 렌더마다 돈다. 그러면 SDK 가 닫은 정보 창(사용자가 닫기 버튼을 누름, 같은 지도의 다른 정보 창이
  // 열림)을 렌더마다 다시 열었다. 두 정보 창이 open 이면 서로 닫고 열기를 되풀이했다.
  const anchor = useStableValue(props.anchor);
  const openedRef = useRef<{ anchor: unknown } | null>(null);
  useEffect(() => {
    if (open === undefined || !sdkAlive() || !ready) return;
    if (open) {
      // 이미 그 anchor 로 열려 있으면 다시 열지 않는다(StrictMode 의 effect 재실행). open 은 close 와
      // open 이벤트를 다시 내고 autoPan 도 다시 돈다. 숨겼다 보이면(Activity 등) 닫혀 있으므로 다시 연다.
      const opened = openedRef.current;
      if (opened && opened.anchor === anchor && infoWindow.getMap()) return;
      if (anchor) {
        infoWindow.open(map, anchor);
      } else {
        infoWindow.open(map);
      }
      openedRef.current = { anchor };
    } else {
      openedRef.current = null;
      infoWindow.close();
    }
  }, [infoWindow, map, open, anchor, ready]);

  // content 변경 시 네이티브 setContent 호출
  useEffect(() => {
    infoWindow.setContent(content);
  }, [infoWindow, content]);

  // 옵션마다 비교해 바뀐 것만 맞춘다(useControlledProps). 객체 하나로 setOptions 하면 모든 키의
  // _changed 가 나고 다시 그린다.
  useControlledProps(infoWindow, pick(props, OPTIONS));

  useOverlayEvents(infoWindow, props, CHANGES);

  return null;
}
