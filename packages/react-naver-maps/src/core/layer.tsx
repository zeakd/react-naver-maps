'use client';

import type { Ref } from 'react';
import { useImperativeHandle } from 'react';
import { useNavermaps } from './hooks/use-navermaps.js';
import { useMap } from './hooks/use-map.js';
import { onMap, useSdkInstance } from './lifetime.js';
import { omitUndefined } from './utils/omit-undefined.js';

/**
 * 사용자 정의 레이어를 지도에 올린다. SDK 의 `new naver.maps.Layer(name, mapTypeOrRegistry, options)` 다.
 *
 * ```tsx
 * const tileGrid = useMemo(
 *   () => ({ name: 'TileGrid', minZoom: -1, maxZoom: 14, tileSize: new navermaps.Size(256, 256), getTile }),
 *   [navermaps],
 * );
 * <NaverMap>
 *   <Layer name="tileGrid" mapTypeOrRegistry={tileGrid} />
 * </NaverMap>
 * ```
 *
 * `name`, `mapTypeOrRegistry`, 옵션은 SDK 에 setter 가 없어 바뀌면 레이어를 다시 만든다(값으로 비교).
 * `mapTypeOrRegistry` 는 `useMemo` 로 한 번 만든다. 렌더마다 새 MapType 객체를 만들면
 * (getTile 이 매번 새 함수이면) 렌더마다 레이어가 다시 만들어진다.
 */
export interface LayerProps {
  ref?: Ref<naver.maps.Layer>;
  /** 레이어 이름. 지도의 `map.layers` 키이자 `map.<name>Layer` 키라서 지도 안에서 겹치지 않게 쓴다. */
  name: string;
  /**
   * 레이어가 그릴 지도 유형. MapTypeRegistry 이거나 MapType 하나다(SDK 가 name 을 키로 레지스트리를 만든다).
   * 문서 인자 이름은 `MapTypeRegistry`, SDK 코드의 이름은 `mapTypeOrRegistry` 다.
   */
  mapTypeOrRegistry: naver.maps.MapType | naver.maps.MapTypeRegistry;
  /** 고해상도 타일 사용. 문서 LayerOptions. SDK 3.10.5 코드에서 읽는 곳을 못 찾았다. */
  hd?: boolean;
  /** true 면 타일로 간주해 지도 맨 아래에 두고 타일과 같이 줌 효과를 받는다. false 면 별도 창(pane). */
  overlayMap?: boolean;
  /** 레이어 우선순위. 클수록 위. 오버레이 창은 100 이라 이보다 크면 오버레이 위로 올라간다. */
  zIndex?: number;
}

export function Layer({
  ref,
  name,
  mapTypeOrRegistry,
  hd,
  overlayMap,
  zIndex,
}: LayerProps) {
  const navermaps = useNavermaps();
  const map = useMap();
  const layer = useSdkInstance(
    onMap(map, () => {
      // @types 3.9.2 의 Layer 생성자는 MapTypeRegistry 만 받는다. SDK 와 공식 예제는 MapType 도 받는다.
      const Custom = navermaps.Layer as unknown as new (
        name: string,
        mapTypeOrRegistry: LayerProps['mapTypeOrRegistry'],
        options: naver.maps.LayerOptions,
      ) => naver.maps.Layer;
      const instance = new Custom(
        name,
        mapTypeOrRegistry,
        omitUndefined({ hd, overlayMap, zIndex }),
      );
      instance.setMap(map);
      return instance;
    }),
    [map, name, mapTypeOrRegistry, hd, overlayMap, zIndex],
  );

  useImperativeHandle(ref, () => layer!, [layer]);

  return null;
}
