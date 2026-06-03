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
 * ## Map의 옵션 키 처리
 *
 * `naver.maps.Map`은 옵션을 별도 `_mapOptions` KVO에 저장한다.
 * `addListener(map, 'draggable_changed', ...)`은 Map 자체 KVO에만 등록되어
 * 발화하지 않는다. setOptions/getOptions가 있으면 그 대상(_mapOptions)에 구독한다.
 *
 * ## 내부 컴포넌트에서의 사용
 *
 * useControlledKVO는 이 훅을 사용하지 않는다 (KVO 구독 없이 렌더 시점 직접 비교).
 * 이 훅은 사용자가 KVO 값을 React 상태로 구독하고 싶을 때 직접 사용하는 용도.
 */
export function useKVO<T>(target: naver.maps.KVO, property: string): T {
  type WithOptions = naver.maps.KVO & {
    getOptions?: (key: string) => unknown;
    setOptions?: (key: string, value: unknown) => void;
    _mapOptions?: naver.maps.KVO;
  };
  // Map은 옵션을 _mapOptions에 저장. 거기에 구독해야 발화 받음.
  //
  // 주의: 구독 대상 선택(_mapOptions ?? target)과 읽기 대상 선택(getOptions ?? get)의
  // 조건이 서로 다르다. "getOptions는 있지만 _mapOptions는 없는" 대상(Shape/Marker)에서는
  // 구독은 본체 KVO(target)에, 읽기는 getOptions(→get)에 간다. 현재 SDK에서는 둘이 동일
  // 슬롯을 보므로 정합하지만, Map은 getOptions('minZoom')이 클램프된 userMinZoom을 반환하는 등
  // _mapOptions.get과 의미가 다른 키가 있어, 채널 일치를 깨는 SDK 변경이 있으면 주의가 필요하다.
  const t = target as WithOptions;
  const optionsTarget = t._mapOptions ?? null;

  const subscribe = useCallback(
    (callback: () => void) => {
      // 우선 옵션 KVO에 구독 (Map용). 없으면 본체에 구독.
      const subTarget = optionsTarget ?? target;
      const listener = naver.maps.Event.addListener(
        subTarget,
        `${property}_changed`,
        callback,
      );
      return () => {
        naver.maps.Event.removeListener(listener);
      };
    },
    [target, optionsTarget, property],
  );

  const getSnapshot = useCallback(() => {
    // 읽기도 동일한 우선순위.
    if (typeof t.getOptions === 'function') {
      return t.getOptions(property) as T;
    }
    return target.get(property) as T;
  }, [target, t, property]);

  return useSyncExternalStore(subscribe, getSnapshot);
}
