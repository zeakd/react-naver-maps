'use client';

import type { Ref } from 'react';
import { defineOverlay } from './overlay-spec.js';
import type { EventHandlerProps, MarkerEvent } from './types/overlay-events.js';
import { MARKER_EVENTS } from './types/overlay-events.js';

/** 지도 위에 마커를 표시한다. NaverMap 내부에서 사용. */
export interface MarkerProps extends EventHandlerProps<MarkerEvent> {
  ref?: Ref<naver.maps.Marker>;

  // Controlled
  position?: naver.maps.Coord | naver.maps.CoordLiteral;

  // Uncontrolled default
  defaultPosition?: naver.maps.Coord | naver.maps.CoordLiteral;

  // Options
  icon?:
    | string
    | naver.maps.ImageIcon
    | naver.maps.SymbolIcon
    | naver.maps.HtmlIcon;
  /**
   * 바뀔 때만 적용한다. DROP 이 끝나면 SDK 가 값을 null 로 바꾸는데, 다시 렌더해도 다시 떨어지지
   * 않는다. null 을 주면 애니메이션을 멈춘다(BOUNCE 끄기).
   */
  animation?: naver.maps.Animation | null;
  shape?: naver.maps.MarkerShape;
  title?: string;
  cursor?: string;
  clickable?: boolean;
  draggable?: boolean;
  visible?: boolean;
  zIndex?: number;
}

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
  ],
  changeOnly: ['animation'],
  initial: (props) => ({
    position: props.position ?? props.defaultPosition,
    // SDK 는 지도에 붙을 때 clickable 이 true 인 Marker 에만 DOM 리스너를 단다.
    // 나중에 clickable 을 켜도 이벤트가 오도록 켠 채로 만들고 곧바로 원하는 값으로 되돌린다.
    clickable: true,
  }),
  afterCreate: (marker, props) => {
    if (props.clickable === false) marker.setClickable(false);
  },
  events: MARKER_EVENTS,
});
