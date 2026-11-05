import { useLayoutEffect, useRef } from 'react';
import { kvoEquals } from '../binding/use-controlled-kvo.js';
import { sdkAlive } from '../sdk/listeners.js';

/**
 * NaverMap 의 mapTypes(지도 유형 레지스트리)와 mapTypeId(고른 유형)를 함께 맞춘다.
 *
 * 둘은 서로 기댄다. 레지스트리에 없는 ID 를 넣거나, 지금 ID 가 없는 레지스트리를 넣으면 SDK 가 던진다.
 * 하나씩 넣으면 어느 순서든 그 사이에 이 상태가 생긴다(3.10.5 실측: setMapTypeId 먼저, setOptions('mapTypes')
 * 먼저, setOptions 객체 모두 던짐). KVO 의 setValues 는 값을 다 넣은 뒤 알려서 던지지 않는다. 그래서
 * 레지스트리가 바뀌면 setValues 로 둘을 한 번에 넣는다(e2e "옛 레지스트리에 없는 mapTypeId").
 *
 * 그 밖은 다른 controlled prop 과 같다. 마운트 때는 생성자가 넣었으므로 하지 않는다. ID 만 바뀌면
 * setMapTypeId 로 레지스트리의 선택을 바꾼다. 바깥에서 ID 가 바뀌면(MapTypeControl) prop 으로 되돌린다.
 * 레지스트리는 KVO 객체라 참조로 비교한다. 렌더마다 새로 만들면 매번 넣는다(앱은 useMemo 로 만든다).
 */
export function useMapTypeProps(
  map: naver.maps.Map,
  mapTypes: naver.maps.MapTypeRegistry | undefined,
  mapTypeId: string | undefined,
): void {
  const prevRef = useRef<{ mapTypes: typeof mapTypes } | null>(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const prev = prevRef.current;
    prevRef.current = { mapTypes };
    if (!prev || !sdkAlive()) return;
    if (mapTypes !== undefined && !kvoEquals(mapTypes, prev.mapTypes)) {
      (map as unknown as { setValues(v: object): void }).setValues(
        mapTypeId === undefined ? { mapTypes } : { mapTypes, mapTypeId },
      );
      return;
    }
    if (mapTypeId !== undefined && map.getMapTypeId() !== mapTypeId) {
      map.setMapTypeId(mapTypeId);
    }
  });
}
