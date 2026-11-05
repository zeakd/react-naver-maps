'use client';

import type { Ref } from 'react';
import { useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { useLatest } from '../binding/use-latest.js';
import { useMap } from '../hooks/use-map.js';
import { useSdkInstance } from '../binding/lifetime.js';
import { addMapListener, removeMapListener } from '../sdk/listeners.js';
import type { MapListener } from '../sdk/listeners.js';
import { eventProp } from '../overlays/overlay-events.js';

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

/** 데이터 레이어 `property_changed` 이벤트 인자(공식 문서 Data Events, 3.10.5). */
export type DataPropertyEvent = naver.maps.PropertyEvent;

/**
 * GeoJson, Kml, Gpx 가 함께 쓰는 props. 셋은 "어떤 SDK 메서드로 feature 를 올리느냐"만 다르다
 * (`addGeoJson` / `addKml` / `addGpx`).
 *
 * 지도마다 데이터 레이어(`map.data`)는 하나다. 컴포넌트는 자기가 올린 feature 만 다룬다. `style` 과
 * 이벤트는 그 feature 에만 적용된다. 그러려고 데이터 레이어의 `setStyle` 은 라이브러리가 쓴다.
 * 컴포넌트와 함께 `map.data.setStyle` 을 직접 부르면 덮어쓴다.
 */
export type DataFeaturesProps = {
  /** 올린 feature 배열. */
  ref?: Ref<naver.maps.Feature[]>;
  /** feature 스타일. 객체 또는 feature 를 받아 스타일을 돌려주는 함수. */
  style?: GeoJsonStyle;
  /** 원본의 스타일 값(GeoJSON properties 의 strokeColor 등)을 쓴다. SDK 의 autoStyle. */
  autoStyle?: boolean;
  /**
   * 이 컴포넌트가 올린 feature 의 속성이 `feature.setProperty` 로 바뀔 때. SDK `property_changed`.
   * `addfeature`/`removefeature` 는 라이브러리가 직접 일으키는 일이라 prop 이 없다.
   */
  onPropertyChanged?: (e: DataPropertyEvent) => void;
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

/** 이벤트 이름과 prop 이름. SDK 이벤트 `property_changed` 의 prop 은 `onPropertyChanged` 다. */
type EventProp = readonly [event: string, prop: keyof DataFeaturesProps];
const EVENT_PROPS: readonly EventProp[] = [
  ...DATA_EVENTS.map((e) => [e, eventProp(e)] as const),
  ['property_changed', 'onPropertyChanged'] as const,
];

/**
 * 데이터 레이어에 feature 를 올리고 지킨다. `load` 는 SDK 의 add* 메서드로 올리고 올린 feature 를
 * 돌려준다(SDK 는 세 메서드 모두 `Feature[]` 를 돌려준다, 3.10.5). `source` 나 `autoStyle` 이 바뀌면
 * (참조가 아니라 값 비교, DOM 노드는 참조 비교) 이전 feature 를 빼고 `load` 를 다시 부른다. SDK 는
 * autoStyle 을 올릴 때만 받는다.
 */
export function useDataFeatures(
  props: DataFeaturesProps,
  source: unknown,
  load: (layer: naver.maps.Data, autoStyle: boolean) => naver.maps.Feature[],
): void {
  const { ref, style, autoStyle, ...rest } = props;
  const map = useMap();
  const layer = map.data;
  const ownerRef = useRef<Owner>({ style });

  const add = () => {
    const { owners } = registryOf(layer);
    const features = load(layer, autoStyle ?? false);
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
    [layer, source, autoStyle ?? false],
  );

  useImperativeHandle(ref, () => features!, [features]);

  // style 이 바뀌면 다시 매긴다. 처음 style 이 생길 때 스타일 함수를 단다.
  useLayoutEffect(() => {
    ownerRef.current = { style };
    if (!features) return;
    if (style !== undefined || registryOf(layer).styled) restyle(layer);
  }, [layer, features, style]);

  const handlers = EVENT_PROPS.map(
    ([, prop]) =>
      (rest as Record<string, unknown>)[prop] as
        | ((e: { feature: naver.maps.Feature }) => void)
        | undefined,
  );
  // 리스너는 핸들러가 생기거나 없어질 때만 붙인다. 붙인 리스너는 최신 핸들러를 부른다(binding/use-latest.ts).
  const latest = useLatest(handlers);
  const present = handlers.map((h) => h !== undefined);
  useEffect(() => {
    if (!features) return;
    const mine = new Set(features);
    const listeners: MapListener[] = [];
    EVENT_PROPS.forEach(([event], i) => {
      if (!present[i]) return;
      listeners.push(
        addMapListener(layer, event, (e: { feature: naver.maps.Feature }) => {
          if (mine.has(e.feature)) latest.current[i]?.(e);
        }),
      );
    });
    return () => listeners.forEach((l) => removeMapListener(l));
    // 있음·없음 목록을 펼쳐 deps 로 쓴다. 길이는 EVENT_PROPS 로 정해져 렌더마다 같다.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [layer, features, ...present]);
}
