import type {
  EventHandlerProps,
  ShapeEvent,
} from '../overlays/overlay-events.js';
import { SHAPE_EVENTS, eventProp } from '../overlays/overlay-events.js';

const POINTER_HANDLERS = SHAPE_EVENTS.map(eventProp);

/**
 * 도형의 clickable 값을 정한다.
 *
 * SDK 도형은 기본이 clickable: false 이고, 꺼져 있으면 포인터 이벤트를 모두 버린다.
 * 핸들러를 넘겼는데 조용히 동작하지 않는 일을 막기 위해 핸들러가 있으면 켠다.
 * clickable 을 명시하면 그 값을 따른다.
 */
export function shapeClickable(
  props: EventHandlerProps<ShapeEvent> & { clickable?: boolean },
): boolean {
  return (
    props.clickable ??
    POINTER_HANDLERS.some((name) => props[name] !== undefined)
  );
}
