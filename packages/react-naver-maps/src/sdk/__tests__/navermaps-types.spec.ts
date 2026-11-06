/**
 * 라이브러리와 문서가 기대는 SDK 멤버가 `@types/navermaps` 에 있는지 타입으로 확인한다. `@types` 를 올릴 때
 * 멤버가 빠지거나 바뀌면 여기서 드러난다.
 */
import { describe, test, expectTypeOf } from 'vitest';

describe('@types/navermaps 멤버', () => {
  test('공식 문서에 있는 멤버를 쓸 수 있다', () => {
    expectTypeOf<naver.maps.Map['addOverlayPane']>().toBeFunction();
    expectTypeOf<naver.maps.MarkerOptions['collisionBehavior']>().toEqualTypeOf<
      boolean | undefined
    >();
    expectTypeOf<naver.maps.PointerEvent['overlay']>().toEqualTypeOf<
      naver.maps.OverlayView | undefined
    >();
    expectTypeOf<
      ReturnType<typeof naver.maps.Event.addDOMListener>
    >().toEqualTypeOf<naver.maps.DOMEventListener>();
    // 실제 호출이 반환값 있는 선언으로 풀린다. 타입만 보고 실행하지 않는다.
    const call = (el: HTMLElement) =>
      naver.maps.Event.addDOMListener(el, 'click', (e: MouseEvent) => e);
    expectTypeOf<
      ReturnType<typeof call>
    >().toEqualTypeOf<naver.maps.DOMEventListener>();
    // 지도에 올린 도형을 그리기 도구에 넣고, 종류별 이벤트를 이름으로 듣는다.
    expectTypeOf<
      naver.maps.drawing.DrawingManager['addDrawing']
    >().toBeCallableWith(
      {} as naver.maps.Rectangle,
      1 as naver.maps.drawing.DrawingMode,
    );
    expectTypeOf<naver.maps.Polygon['setEditable']>().not.toBeNever();
    const data = {} as naver.maps.Data;
    expectTypeOf(data.revertStyle).toBeCallableWith();
  });
});
