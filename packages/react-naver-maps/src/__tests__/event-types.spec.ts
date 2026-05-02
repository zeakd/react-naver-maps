/**
 * 이벤트 타입 시스템 테스트
 *
 * 타입 레벨 검증: EventHandlerProps가 올바른 on${Capitalize} 프로퍼티를 생성하는지,
 * 각 오버레이 Props가 올바른 이벤트를 포함하는지 확인.
 */
import { describe, test, expectTypeOf } from 'vitest';
import type {
  EventHandlerProps,
  ShapeEvent,
  MarkerEvent,
  GroundOverlayEvent,
  PointerEventHandler,
} from '../types/overlay-events.js';
import type { MarkerProps } from '../marker.js';
import type { CircleProps } from '../circle.js';
import type { RectangleProps } from '../rectangle.js';
import type { EllipseProps } from '../ellipse.js';
import type { PolygonProps } from '../polygon.js';
import type { PolylineProps } from '../polyline.js';
import type { GroundOverlayProps } from '../ground-overlay.js';

describe('EventHandlerProps 매핑 타입', () => {
  test('ShapeEvent → 7개 핸들러 생성', () => {
    type Result = EventHandlerProps<ShapeEvent>;
    expectTypeOf<Result>().toHaveProperty('onClick');
    expectTypeOf<Result>().toHaveProperty('onDblclick');
    expectTypeOf<Result>().toHaveProperty('onMousedown');
    expectTypeOf<Result>().toHaveProperty('onMouseup');
    expectTypeOf<Result>().toHaveProperty('onRightclick');
    expectTypeOf<Result>().toHaveProperty('onMouseover');
    expectTypeOf<Result>().toHaveProperty('onMouseout');
  });

  test('MarkerEvent → ShapeEvent + drag 계열', () => {
    type Result = EventHandlerProps<MarkerEvent>;
    // Shape events
    expectTypeOf<Result>().toHaveProperty('onClick');
    expectTypeOf<Result>().toHaveProperty('onMousedown');
    // Drag events
    expectTypeOf<Result>().toHaveProperty('onDragstart');
    expectTypeOf<Result>().toHaveProperty('onDrag');
    expectTypeOf<Result>().toHaveProperty('onDragend');
  });

  test('GroundOverlayEvent → click, mousedown, mouseup, rightclick만 (fix-09)', () => {
    type Result = EventHandlerProps<GroundOverlayEvent>;
    expectTypeOf<Result>().toHaveProperty('onClick');
    expectTypeOf<Result>().toHaveProperty('onMousedown');
    expectTypeOf<Result>().toHaveProperty('onMouseup');
    expectTypeOf<Result>().toHaveProperty('onRightclick');

    // SDK가 GROUND_DOMEVENTS에 등록하지 않는 이벤트는 타입에서도 제외되어야 한다.
    // (GROUND_DOMEVENTS = ["click", "mousedown", "mouseup", "contextmenu"])
    // GroundOverlayEvent 유니온이 정확히 4종임을 검증한다.
    expectTypeOf<GroundOverlayEvent>().toEqualTypeOf<
      'click' | 'mousedown' | 'mouseup' | 'rightclick'
    >();
  });

  test('핸들러 시그니처가 PointerEventHandler', () => {
    type Result = EventHandlerProps<'click'>;
    expectTypeOf<
      Required<Result>['onClick']
    >().toEqualTypeOf<PointerEventHandler>();
  });
});

describe('각 오버레이 Props에 이벤트 포함 확인', () => {
  test('MarkerProps에 drag 이벤트 포함', () => {
    expectTypeOf<MarkerProps>().toHaveProperty('onDragstart');
    expectTypeOf<MarkerProps>().toHaveProperty('onDrag');
    expectTypeOf<MarkerProps>().toHaveProperty('onDragend');
    expectTypeOf<MarkerProps>().toHaveProperty('onMousedown');
    expectTypeOf<MarkerProps>().toHaveProperty('onRightclick');
  });

  test('CircleProps에 Shape 이벤트 포함', () => {
    expectTypeOf<CircleProps>().toHaveProperty('onClick');
    expectTypeOf<CircleProps>().toHaveProperty('onMousedown');
    expectTypeOf<CircleProps>().toHaveProperty('onMouseup');
    expectTypeOf<CircleProps>().toHaveProperty('onRightclick');
  });

  test('RectangleProps에 Shape 이벤트 포함', () => {
    expectTypeOf<RectangleProps>().toHaveProperty('onClick');
    expectTypeOf<RectangleProps>().toHaveProperty('onMousedown');
  });

  test('EllipseProps에 Shape 이벤트 포함', () => {
    expectTypeOf<EllipseProps>().toHaveProperty('onClick');
    expectTypeOf<EllipseProps>().toHaveProperty('onMouseup');
  });

  test('PolygonProps에 Shape 이벤트 포함 (mousedown 포함)', () => {
    expectTypeOf<PolygonProps>().toHaveProperty('onClick');
    expectTypeOf<PolygonProps>().toHaveProperty('onMousedown');
    expectTypeOf<PolygonProps>().toHaveProperty('onMouseup');
  });

  test('PolylineProps에 Shape 이벤트 포함 (mousedown 포함)', () => {
    expectTypeOf<PolylineProps>().toHaveProperty('onClick');
    expectTypeOf<PolylineProps>().toHaveProperty('onMousedown');
    expectTypeOf<PolylineProps>().toHaveProperty('onMouseup');
  });

  test('GroundOverlayProps에 click/mousedown/mouseup/rightclick (fix-09)', () => {
    expectTypeOf<GroundOverlayProps>().toHaveProperty('onClick');
    expectTypeOf<GroundOverlayProps>().toHaveProperty('onMousedown');
    expectTypeOf<GroundOverlayProps>().toHaveProperty('onMouseup');
    expectTypeOf<GroundOverlayProps>().toHaveProperty('onRightclick');
  });

  test('GroundOverlayProps의 이벤트 핸들러는 4종만 (fix-09)', () => {
    // EventHandlerProps<GroundOverlayEvent>가 정확한 키 집합을 갖는지 검증
    type Handlers = EventHandlerProps<GroundOverlayEvent>;
    type HandlerKeys = keyof Handlers;
    expectTypeOf<HandlerKeys>().toEqualTypeOf<
      'onClick' | 'onMousedown' | 'onMouseup' | 'onRightclick'
    >();
  });
});
