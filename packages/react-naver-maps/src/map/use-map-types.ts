import { useLayoutEffect, useRef } from 'react';
import { kvoEquals } from '../binding/use-controlled-kvo.js';
import { sdkAlive } from '../sdk/listeners.js';

type Registry = naver.maps.MapTypeRegistry & {
  getTypeIds?: () => string[];
  getSelectedTypeId?: () => string;
};
type MapWithValues = naver.maps.Map & { setValues(values: object): void };

/**
 * NaverMap 의 mapTypes(지도 유형 레지스트리)와 mapTypeId(고른 유형)를 함께 맞춘다.
 *
 * 둘은 서로 기댄다. 레지스트리에 없는 ID 를 넣거나, 지금 ID 가 없는 레지스트리를 넣으면 SDK 가 던진다.
 * 하나씩 넣으면 어느 순서든 그 사이에 이 상태가 생긴다(3.10.5 실측: setMapTypeId 먼저, setOptions('mapTypes')
 * 먼저, setOptions 객체 모두 던짐). KVO 의 setValues 는 값을 다 넣은 뒤 알려서 던지지 않는다. 다만
 * Map 의 옵션 저장은 바꾸지 않아 getOptions('mapTypes') 가 옛 레지스트리를 돌려준다. 그래서 setValues 로
 * 둘을 넣은 뒤, 이제 ID 가 들어 있는 레지스트리를 setOptions 로 한 번 더 넣는다(던지지 않고 getOptions 의
 * mapTypes·mapTypeId 가 맞춰진다, 3.10.5 실측). e2e "옛 레지스트리에 없는 mapTypeId".
 *
 * 그 밖은 다른 controlled prop 과 같다(useControlledProps). 마운트 때는 생성자가 넣었으므로 하지 않는다.
 * 렌더마다 SDK 가 지금 가진 값과 prop 을 견줘 다르면 맞춘다. 그래서 바깥에서 바꾼 것(ref 로 setOptions,
 * MapTypeControl 로 유형 고르기)도 다음 렌더에 prop 으로 되돌린다. 레지스트리는 KVO 객체라 참조로 비교한다.
 * 렌더마다 새로 만들면 매번 넣는다(앱은 useMemo 로 만든다). ID 만 바뀌면 setMapTypeId 로 레지스트리의 선택을
 * 바꾼다.
 */
export function useMapTypeProps(
  map: naver.maps.Map,
  mapTypes: naver.maps.MapTypeRegistry | undefined,
  mapTypeId: string | undefined,
): void {
  const mountedRef = useRef(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const mounting = !mountedRef.current;
    mountedRef.current = true;
    if (mounting || !sdkAlive()) return;
    if (
      mapTypes !== undefined &&
      !kvoEquals(map.getOptions('mapTypes'), mapTypes)
    ) {
      const id = mapTypeId ?? keptId(map.getMapTypeId(), mapTypes);
      (map as MapWithValues).setValues({ mapTypes, mapTypeId: id });
      map.setOptions('mapTypes', mapTypes);
      return;
    }
    if (mapTypeId !== undefined && map.getMapTypeId() !== mapTypeId) {
      map.setMapTypeId(mapTypeId);
    }
  });
}

/** mapTypeId prop 이 없을 때: 지금 ID 가 새 레지스트리에 있으면 그대로, 없으면 레지스트리가 고른 유형. */
function keptId(current: string, registry: Registry): string {
  const ids = registry.getTypeIds?.();
  if (!ids || ids.includes(current)) return current;
  return registry.getSelectedTypeId?.() ?? ids[0] ?? current;
}
