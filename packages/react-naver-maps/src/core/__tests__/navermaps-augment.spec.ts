/**
 * @types/navermaps 보강(types/navermaps-augment.ts)이 패키지 진입점으로 들어가는지 타입으로 확인한다.
 * 진입점만 import 한다. 보강 파일을 직접 import 하지 않는다.
 */
import { describe, test, expectTypeOf } from 'vitest';
// 진입점만 끌어온다.
// oxlint-disable-next-line unicorn/require-module-specifiers, import/no-empty-named-blocks
import type {} from '../react-naver-maps.js';

describe('@types/navermaps 보강', () => {
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
