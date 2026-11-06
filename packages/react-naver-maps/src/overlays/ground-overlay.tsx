'use client';

import type { Ref } from 'react';
import { defineOverlay } from './overlay-spec.js';
import type {
  EventHandlerProps,
  GroundOverlayEvent,
} from './overlay-events.js';
import { GROUND_OVERLAY_EVENTS } from './overlay-events.js';

/**
 * 이미지를 지도 위에 오버레이한다.
 *
 * ## url/bounds 변경 시 인스턴스 재생성
 *
 * 네이버맵 API에 setBounds()가 없다.
 * setUrl()은 존재하지만 내부적으로 KVO set("url")을 호출하지 않아
 * getUrl()과 불일치가 발생하는 불완전한 구현이다.
 *
 * 따라서 url/bounds 가 바뀌면 인스턴스를 다시 만든다(spec 의 `keys`, 값으로 비교).
 * 이전 인스턴스는 lifetime.ts 규칙대로 버린다.
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

// SDK 는 GROUND_DOMEVENTS(click/mousedown/mouseup/contextmenu)를 등록하고, click 리스너가
// 연속 클릭을 합성 dblclick 으로, contextmenu 를 rightclick 으로 발화한다.
export const GroundOverlay = defineOverlay<
  GroundOverlayProps,
  naver.maps.GroundOverlay
>('GroundOverlay', {
  create: (navermaps, options, props) =>
    new navermaps.GroundOverlay(props.url, props.bounds, options),
  // url, bounds 는 생성자 인자라 setter 가 없다. 바뀌면 다시 만든다.
  keys: (props) => [props.url, props.bounds],
  options: ['opacity', 'clickable', 'crossOrigin'],
  events: GROUND_OVERLAY_EVENTS,
});
