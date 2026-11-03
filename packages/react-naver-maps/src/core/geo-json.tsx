'use client';

import type { Ref } from 'react';
import { useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { useMap } from './hooks/use-map.js';
import { useSdkInstance } from './lifetime.js';
import { addMapListener, removeMapListener } from './utils/sdk.js';
import type { MapListener } from './utils/sdk.js';
import { eventProp } from './types/overlay-events.js';

/** 데이터 레이어 feature 가 내는 포인터 이벤트(SDK Feature.EVENT_LIST, 3.10.5). */
export const DATA_EVENTS = [
  'click',
  'dblclick',
  'mouseover',
  'mouseout',
  'mousedown',
  'mouseup',
  'rightclick',
] as const;
export type DataEvent = (typeof DATA_EVENTS)[number];

/** 데이터 레이어 이벤트. 어느 feature 에서 났는지 `feature` 로 알 수 있다. */
export type DataPointerEvent = naver.maps.PointerEvent & {
  feature: naver.maps.Feature;
};

export type GeoJsonStyle =
  | naver.maps.StyleOptions
  | ((feature: naver.maps.Feature) => naver.maps.StyleOptions | undefined);

/**
 * GeoJSON 을 지도의 데이터 레이어(`map.data`)에 올린다. SDK 의 `Data.addGeoJson` 이다.
 *
 * ```tsx
 * <NaverMap>
 *   <GeoJson
 *     data={regions}
 *     style={(feature) => ({ fillColor: feature.getProperty('color') })}
 *     onClick={(e) => select(e.feature.getProperty('id'))}
 *   />
 * </NaverMap>
 * ```
 *
 * 지도마다 데이터 레이어는 하나다. GeoJson 은 자기가 올린 feature 만 다룬다. `style` 과 이벤트는
 * 이 컴포넌트가 올린 feature 에만 적용된다. 그러려고 데이터 레이어의 `setStyle` 은 라이브러리가
 * 쓴다. GeoJson 과 함께 `map.data.setStyle` 을 직접 부르면 덮어쓴다.
 */
export type GeoJsonProps = {
  ref?: Ref<naver.maps.Feature[]>;
  /** 올릴 GeoJSON. 값이 바뀌면 이전 feature 를 빼고 새로 올린다(값으로 비교). */
  data: naver.maps.GeoJSON;
  /** feature 스타일. 객체 또는 feature 를 받아 스타일을 돌려주는 함수. */
  style?: GeoJsonStyle;
  /** GeoJSON properties 의 스타일 값(strokeColor 등)을 쓴다. SDK addGeoJson 의 autoStyle. */
  autoStyle?: boolean;
} & {
  [K in DataEvent as `on${Capitalize<K>}`]?: (e: DataPointerEvent) => void;
};

type Owner = { style?: GeoJsonStyle };

/**
 * 데이터 레이어마다 feature → 그 feature 를 올린 GeoJson. 스타일 함수는 하나만 두고 여기서
 * 주인의 style 을 찾아 쓴다. 주인에게 style 이 없으면 아무것도 돌려주지 않아 SDK 가 그 feature 의
 * 스타일(autoStyle 포함)을 그대로 둔다(`_setFeatureStyle`, 3.10.5).
 */
const registries = new WeakMap<
  naver.maps.Data,
  { owners: Map<naver.maps.Feature, { current: Owner }>; styled: boolean }
>();

function registryOf(data: naver.maps.Data) {
  let registry = registries.get(data);
  if (!registry) {
    registry = { owners: new Map(), styled: false };
    registries.set(data, registry);
  }
  return registry;
}

function styleDispatcher(data: naver.maps.Data) {
  const { owners } = registryOf(data);
  return (feature: naver.maps.Feature) => {
    const style = owners.get(feature)?.current.style;
    return typeof style === 'function' ? style(feature) : style;
  };
}

/** 스타일을 다시 계산하게 한다. SDK 는 setStyle 할 때 모든 feature 에 스타일을 다시 매긴다. */
function restyle(data: naver.maps.Data) {
  const registry = registryOf(data);
  registry.styled = true;
  data.setStyle(styleDispatcher(data) as unknown as naver.maps.StylingFunction);
}

export function GeoJson({
  ref,
  data,
  style,
  autoStyle,
  ...rest
}: GeoJsonProps) {
  const map = useMap();
  const layer = map.data;
  const ownerRef = useRef<Owner>({ style });

  const add = () => {
    const { owners } = registryOf(layer);
    // 타입은 void 지만 SDK 는 올린 feature 배열을 돌려준다(3.10.5).
    const features = layer.addGeoJson(
      data,
      autoStyle ?? false,
    ) as unknown as naver.maps.Feature[];
    for (const feature of features) owners.set(feature, ownerRef);
    return features;
  };
  const remove = (features: naver.maps.Feature[]) => {
    const { owners } = registryOf(layer);
    for (const feature of features) {
      owners.delete(feature);
      layer.removeFeature(feature);
    }
  };

  const features = useSdkInstance<naver.maps.Feature[]>(
    {
      create: add,
      attach: (list) => {
        const { owners } = registryOf(layer);
        for (const feature of list) {
          owners.set(feature, ownerRef);
          layer.addFeature(feature, autoStyle ?? false);
        }
      },
      detach: remove,
      dispose: remove,
    },
    [layer, data],
  );

  useImperativeHandle(ref, () => features!, [features]);

  // style 이 바뀌면 다시 매긴다. 처음 style 이 생길 때 스타일 함수를 단다.
  useLayoutEffect(() => {
    ownerRef.current = { style };
    if (!features) return;
    if (style !== undefined || registryOf(layer).styled) restyle(layer);
  }, [layer, features, style]);

  const handlers = DATA_EVENTS.map(
    (event) =>
      (rest as Record<string, unknown>)[eventProp(event)] as
        | ((e: DataPointerEvent) => void)
        | undefined,
  );
  useEffect(() => {
    if (!features) return;
    const mine = new Set(features);
    const listeners: MapListener[] = [];
    DATA_EVENTS.forEach((event, i) => {
      const handler = handlers[i];
      if (!handler) return;
      listeners.push(
        addMapListener(layer, event, (e: DataPointerEvent) => {
          if (mine.has(e.feature)) handler(e);
        }),
      );
    });
    return () => listeners.forEach((l) => removeMapListener(l));
    // 핸들러 목록을 펼쳐 deps 로 쓴다. 길이는 DATA_EVENTS 로 정해져 렌더마다 같다.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [layer, features, ...handlers]);

  return null;
}
