/**
 * 오버레이별 이벤트 유니온 + 매핑 유틸리티 타입
 *
 * 근거: 공식 API 문서 각 클래스의 Events(SDK 3.10.5).
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
 * GroundOverlay: SDK 는 DOM 의 click·mousedown·mouseup·contextmenu 만 받는다.
 * 250ms·5px 안의 연속 클릭은 SDK 가 dblclick 으로 발화하고, contextmenu 는 rightclick 으로 발화한다.
 * mouseover/mouseout/mousemove 는 발화하지 않는다(SDK 3.10.5 기준).
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

/** `click` → `onClick`. EventHandlerProps의 키와 같은 규칙이다. */
export function eventProp<E extends string>(event: E): `on${Capitalize<E>}` {
  return `on${event.charAt(0).toUpperCase()}${event.slice(1)}` as `on${Capitalize<E>}`;
}

/**
 * KVO 값 변경 이벤트(`position_changed` 등)의 prop. `position` → `onPositionChanged(value)`.
 * SDK 는 바뀐 값을 인자로 준다(KVO, 3.10.5). M 은 키 → 값 타입(공식 문서 Events 의 인자 타입).
 */
export type ChangeHandlerProps<M> = {
  [K in keyof M & string as `on${Capitalize<K>}Changed`]?: (
    value: M[K],
  ) => void;
};

/** `position` → `onPositionChanged`. ChangeHandlerProps의 키와 같은 규칙이다. */
export function changedProp(key: string): string {
  return `on${key.charAt(0).toUpperCase()}${key.slice(1)}Changed`;
}
