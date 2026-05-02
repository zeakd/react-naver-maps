/**
 * 오버레이별 이벤트 유니온 + 매핑 유틸리티 타입
 *
 * 근거: docs/references/navermaps-api.md
 * 각 오버레이가 지원하는 포인터 이벤트를 타입 레벨에서 제한한다.
 */

/** Shape 공통: Circle, Rectangle, Ellipse, Polygon, Polyline */
export type ShapeEvent =
  | 'click'
  | 'dblclick'
  | 'mousedown'
  | 'mouseup'
  | 'rightclick'
  | 'mouseover'
  | 'mouseout'
  | 'mousemove';

/** Marker: Shape + drag 계열 */
export type MarkerEvent = ShapeEvent | 'dragstart' | 'drag' | 'dragend';

/**
 * GroundOverlay: SDK가 GROUND_DOMEVENTS = ["click", "mousedown", "mouseup", "contextmenu"]만 등록한다.
 * dblclick/mouseover/mouseout/mousemove는 발화하지 않는다.
 * 근거: maps.beautified.js:862 (B = GROUND_DOMEVENTS).
 */
export type GroundOverlayEvent =
  | 'click'
  | 'mousedown'
  | 'mouseup'
  | 'rightclick';

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
