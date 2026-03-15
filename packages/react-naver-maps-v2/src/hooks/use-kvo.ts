import { useCallback, useSyncExternalStore } from 'react';

/**
 * KVO 프로퍼티를 구독하여 변경 시 리렌더링한다. useSyncExternalStore 기반.
 *
 * ## 퍼포먼스 경고
 *
 * 네이버맵의 KVO set()은 완전 동기이고 배치 처리가 없다.
 * 드래그 중 center_changed는 매 프레임(~60fps) 발화된다.
 * 이 훅으로 center를 구독하면 **매 프레임 React 리렌더**가 발생한다.
 *
 * 고주기 KVO 목록 (드래그/줌 시 매 프레임 발화):
 * - center, centerPoint, bounds, projectionTopLeft, containerTopLeft
 *
 * 저주기 KVO (사용자 액션 시에만 변경, 이 훅 사용 OK):
 * - mapTypeId, zoom (줌 애니메이션 완료 시에만), draggable, visible 등
 *
 * ## 내부 컴포넌트에서의 사용
 *
 * useControlledKVO는 이 훅을 사용하지 않는다 (KVO 구독 없이 렌더 시점 직접 비교).
 * 이 훅은 사용자가 KVO 값을 React 상태로 구독하고 싶을 때 직접 사용하는 용도.
 */
export function useKVO<T>(target: naver.maps.KVO, property: string): T {
  const subscribe = useCallback(
    (callback: () => void) => {
      const listener = naver.maps.Event.addListener(
        target,
        `${property}_changed`,
        callback,
      );
      return () => {
        naver.maps.Event.removeListener(listener);
      };
    },
    [target, property],
  );

  const getSnapshot = useCallback(
    () => target.get(property) as T,
    [target, property],
  );

  return useSyncExternalStore(subscribe, getSnapshot);
}
