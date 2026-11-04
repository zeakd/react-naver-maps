/**
 * 오버레이별 이벤트 유니온 + 매핑 유틸리티 타입
 *
 * 근거: docs/references/navermaps-api.md
 * 각 오버레이가 지원하는 포인터 이벤트를 타입 레벨에서 제한한다.
 */

/** Shape 공통: Circle, Rectangle, Ellipse, Polygon, Polyline */
export const SHAPE_EVENTS = [
  'click',
  'dblclick',
  'mousedown',
  'mouseup',
  'rightclick',
  'mouseover',
  'mouseout',
  'mousemove',
] as const;
export type ShapeEvent = (typeof SHAPE_EVENTS)[number];

/**
 * Marker: Shape 에서 mousemove 를 뺀 것 + drag 계열. SDK 마커는 mousemove DOM 리스너를 달지 않는다
 * (3.10.5). 문서의 touchstart, touchend 는 SDK 가 mousedown, mouseup 으로 바꿔 내므로 없다.
 */
export const MARKER_EVENTS = [
  'click',
  'dblclick',
  'mousedown',
  'mouseup',
  'rightclick',
  'mouseover',
  'mouseout',
  'dragstart',
  'drag',
  'dragend',
] as const;
export type MarkerEvent = (typeof MARKER_EVENTS)[number];

/**
 * GroundOverlay: SDK가 GROUND_DOMEVENTS = ["click", "mousedown", "mouseup", "contextmenu"]를 등록한다.
 * click 리스너는 250ms·5px 이내 연속 클릭을 합성 dblclick으로 trigger하고,
 * contextmenu는 rightclick으로 매핑되어 발화한다.
 * mouseover/mouseout/mousemove는 별도 DOM 이벤트 배열이라 GroundOverlay가 바인딩하지 않는다.
 * 근거: maps.beautified.js:862 (GROUND_DOMEVENTS), :9014 (_getSingleClickType → "dblclick"), :275 (이벤트명 매핑 J: contextmenu→rightclick).
 */
export const GROUND_OVERLAY_EVENTS = [
  'click',
  'dblclick',
  'mousedown',
  'mouseup',
  'rightclick',
] as const;
export type GroundOverlayEvent = (typeof GROUND_OVERLAY_EVENTS)[number];

export type PointerEventHandler = (e: naver.maps.PointerEvent) => void;

/**
 * 이벤트 이름 유니온 → `on${Capitalize<E>}` props로 변환
 *
 * @example
 * type CircleEventProps = EventHandlerProps<ShapeEvent>;
 * // { onClick?: PointerEventHandler; onDblclick?: PointerEventHandler; ... }
 */
export type EventHandlerProps<E extends string> = {
  [K in E as `on${Capitalize<K>}`]?: PointerEventHandler;
};

/** `click` → `onClick`. EventHandlerProps 의 키와 같은 규칙이다. */
export function eventProp<E extends string>(event: E): `on${Capitalize<E>}` {
  return `on${event.charAt(0).toUpperCase()}${event.slice(1)}` as `on${Capitalize<E>}`;
}
