import { useLayoutEffect, useRef } from 'react';

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * 네이버맵 KVO 값 비교.
 *
 * 비교 전략:
 * 1. === (참조 동일)
 * 2. .equals() (LatLng, LatLngBounds, Point 등 네이버맵 객체)
 *
 * 네이버맵 내부 equals 동작:
 * - LatLng.equals: Chebyshev 거리, epsilon 1e-9
 * - LatLngBounds.equals: 내부적으로 LatLng.equals 사용
 * - Point/Size.equals: loose equality (==)
 *
 * 배열(paths, path)은 equals가 없으므로 === 비교만 됨.
 * 안정적인 참조를 전달해야 불필요한 setter 호출을 방지할 수 있다.
 */
export function kvoEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (
    typeof a === 'object' &&
    typeof b === 'object' &&
    'equals' in a &&
    typeof (a as { equals: (v: unknown) => boolean }).equals === 'function'
  ) {
    return (a as { equals: (v: unknown) => boolean }).equals(b);
  }
  return false;
}

/**
 * React prop → KVO 프로퍼티 단방향 동기화.
 *
 * ## 설계 근거
 *
 * 네이버맵의 KVO set()은 완전 동기이고 배치 처리가 없다.
 * 데스크톱 드래그 시 매 프레임 center_changed + bounds_changed 등이 동기 발화된다.
 *
 * 이전 구현에서 useSyncExternalStore로 KVO를 구독하면:
 * - uncontrolled(value === undefined)에서도 매 프레임 리렌더 발생
 * - NaverMapInner 리렌더 → children(Marker, Circle 등) 전체 리렌더 전파
 * - 17개 useControlledKVO × 매 프레임 = 심각한 퍼포먼스 저하
 *
 * 현재 구현은 KVO를 구독하지 않고, 렌더 시점에 target.get()으로 직접 읽어 비교한다.
 * (v1 패턴: tmp/react-naver-maps/src/naver-map.tsx getDirtyKVOs)
 *
 * ## useLayoutEffect를 쓰는 이유
 *
 * KVO setter는 네이버맵의 DOM 상태(타일 위치, 오버레이 위치 등)를 즉시 변경한다.
 * useEffect(paint 후)에서 호출하면 이전 상태가 한 프레임 보인다 (깜빡임).
 * useLayoutEffect(paint 전)에서 호출해야 시각적 일관성이 보장된다.
 *
 * ## deps 생략 이유
 *
 * deps 없이 매 렌더마다 실행한다. 의존 값이 외부 시스템(KVO)의 현재 상태이므로
 * React deps로 표현할 수 없다. KVO get()은 `return this[key]` 한 줄이라 무비용.
 *
 * ## 첫 렌더 skip 이유
 *
 * 컴포넌트 생성자(new navermaps.Marker(options) 등)에서 이미 옵션이 적용된다.
 * 첫 렌더에서 다시 setter를 호출하면 중복 호출 + 불필요한 KVO 이벤트 발생.
 *
 * ## 주의: NaverMap의 center/zoom/bounds에는 이 훅을 사용하지 않는다
 *
 * center/zoom/bounds는 상호 의존적이어서 개별 setter로 처리하면 지도가 튕긴다.
 * NaverMapInner에서 전용 dirty diff + morph/panTo/fitBounds 우선순위로 처리한다.
 */
export function useControlledKVO(
  target: naver.maps.KVO,
  property: string,
  value?: unknown,
): void {
  const isFirstRef = useRef(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (isFirstRef.current) {
      isFirstRef.current = false;
      return;
    }
    if (value === undefined) return;

    const current = target.get(property);
    if (kvoEquals(current, value)) return;

    const setterName = `set${capitalize(property)}`;
    if (
      typeof (target as unknown as Record<string, unknown>)[setterName] ===
      'function'
    ) {
      (target as unknown as Record<string, (v: unknown) => void>)[setterName](
        value,
      );
    } else {
      target.set(property, value);
    }
  });
}
