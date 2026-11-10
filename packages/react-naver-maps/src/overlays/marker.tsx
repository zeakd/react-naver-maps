'use client';

import type { Ref } from 'react';
import type { AnimationName } from '../sdk/constants.js';
import { defineOverlay } from './overlay-spec.js';
import type {
  ChangeHandlerProps,
  EventHandlerProps,
  MarkerEvent,
} from './overlay-events.js';
import { MARKER_EVENTS } from './overlay-events.js';

/** 지도 위에 마커를 표시한다. NaverMap 내부에서 사용. */
export interface MarkerProps
  extends
    EventHandlerProps<MarkerEvent>,
    ChangeHandlerProps<{
      clickable: boolean;
      draggable: boolean;
      icon: MarkerIcon;
      position: naver.maps.Coord;
      title: string;
      visible: boolean;
      zIndex: number;
    }> {
  ref?: Ref<naver.maps.Marker>;

  // Controlled
  /** 마커 좌표. 렌더링할 때 이 값으로 위치를 맞춥니다. 끌어 옮긴 위치를 유지하려면 `onDragend` 로 state 를 변경하거나 `defaultPosition` 을 사용합니다. */
  position?: naver.maps.Coord | naver.maps.CoordLiteral;

  // Uncontrolled default
  /** 처음 좌표. 그 뒤로는 SDK 가 관리한다(끌어 옮긴 위치를 되돌리지 않는다). */
  defaultPosition?: naver.maps.Coord | naver.maps.CoordLiteral;

  // Options
  /** 마커 모양. 이미지 주소, `ImageIcon`, `SymbolIcon`, `HtmlIcon`(`{ content, size, anchor }`)을 사용할 수 있습니다. 값이 같으면 다시 설정하지 않습니다. */
  icon?: MarkerIcon;
  /**
   * 바뀔 때만 적용한다. DROP 이 끝나면 SDK 가 값을 null 로 바꾸는데, 다시 렌더해도 다시 떨어지지
   * 않는다. null 을 주면 애니메이션을 멈춘다(BOUNCE 끄기).
   */
  animation?: AnimationName | null;
  /** 클릭을 받는 영역(`MarkerShape`). 아이콘의 투명한 부분을 빼고 싶을 때. */
  shape?: naver.maps.MarkerShape;
  /** 마우스를 올렸을 때 보이는 툴팁 글자. */
  title?: string;
  /** 마우스를 올렸을 때의 커서(CSS cursor 값). */
  cursor?: string;
  /** 마우스·터치 이벤트를 받을지 여부. 끄면 아래에 있는 지도가 이벤트를 받는다. */
  clickable?: boolean;
  /** 끌어서 옮길 수 있는지 여부. */
  draggable?: boolean;
  /** 보일지 여부. */
  visible?: boolean;
  /** 겹쳤을 때의 쌓임 순서. 클수록 위에 그린다. */
  zIndex?: number;
  /** GL 서브모듈에서 다른 마커와 겹치면 숨긴다(공식 문서 MarkerOptions). GL 이 아니면 SDK 가 무시한다. */
  collisionBehavior?: boolean;
  /** collisionBehavior 에서 겹침을 재는 크기. */
  collisionBoxSize?: naver.maps.Size | naver.maps.SizeLiteral;
  /** 이미지 아이콘을 다 불러왔을 때(SDK `icon_loaded`). */
  onIconLoaded?: (marker: naver.maps.Marker) => void;
}

/** Marker 아이콘. 이미지 URL, ImageIcon, SymbolIcon, HtmlIcon. */
export type MarkerIcon =
  | string
  | naver.maps.ImageIcon
  | naver.maps.SymbolIcon
  | naver.maps.HtmlIcon;

export const Marker = defineOverlay<MarkerProps, naver.maps.Marker>('Marker', {
  create: (navermaps, options) =>
    new navermaps.Marker(options as unknown as naver.maps.MarkerOptions),
  options: [
    'position',
    'icon',
    'animation',
    'shape',
    'title',
    'cursor',
    'clickable',
    'draggable',
    'visible',
    'zIndex',
    'collisionBehavior',
    'collisionBoxSize',
  ],
  changeOnly: ['animation'],
  constants: { animation: 'Animation' },
  panorama: true,
  extraOptions: {},
  initial: (props) => ({
    position: props.position ?? props.defaultPosition,
  }),
  // SDK 는 지도에 붙일 때 clickable 이 true 인 Marker 에만 DOM 리스너를 단다(3.10.5). 나중에 clickable 을
  // 켜도 이벤트가 오도록 붙일 때마다(처음, 숨겼다 다시 보일 때, StrictMode 재실행) 켠 채로 붙이고
  // 원래 값으로 되돌린다.
  attachTo: (marker, host) => {
    const clickable = marker.getClickable();
    if (!clickable) marker.setClickable(true);
    marker.setMap(host);
    if (!clickable) marker.setClickable(false);
  },
  events: MARKER_EVENTS,
  changes: [
    'clickable',
    'draggable',
    'icon',
    'position',
    'title',
    'visible',
    'zIndex',
  ],
  otherEvents: [['icon_loaded', 'onIconLoaded']],
});
