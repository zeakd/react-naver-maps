'use client';

import type { Ref } from 'react';
import { useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { useLatest } from '../binding/use-latest.js';
import { useMap } from '../hooks/use-map.js';
import { useSdkInstance } from '../binding/lifetime.js';
import {
  addMapListener,
  removeMapListener,
  sdkAlive,
} from '../sdk/listeners.js';
import type { MapListener } from '../sdk/listeners.js';
import { eventProp } from '../overlays/overlay-events.js';

/** 데이터 레이어 feature가 내는 포인터 이벤트(SDK Feature.EVENT_LIST, 3.10.5). */
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

/** 데이터 레이어 이벤트. 어느 feature에서 났는지 `feature`로 알 수 있다. */
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
 *
 * `style` 함수가 불리는 때:
 * - 그 컴포넌트의 `style` 이 바뀔 때(올린 feature 가 바뀔 때 포함). 그 컴포넌트의 feature 만 칠한다.
 * - SDK 가 feature 를 다시 칠할 때. feature 를 올리거나 숨겼다 다시 보일 때, `feature.setProperty` 뒤.
 * - 레이어 전체를 다시 칠할 때. 지도에서 처음 `style` 을 쓸 때와, `map.data.setStyle` 로 바뀐 레이어를
 *   되찾을 때다. 이때는 그 지도의 모든 컴포넌트의 `style` 함수가 불린다.
 * 다른 컴포넌트의 `style` 이 바뀌었다고 불리지는 않는다. 함수가 props·feature 밖의 값을 읽으면 그 값은
 * 위 때에만 반영된다.
 */
export type DataFeaturesProps = {
  /** 올린 feature 배열. */
  ref?: Ref<naver.maps.Feature[]>;
  /** feature 스타일. 객체 또는 feature를 받아 스타일을 돌려주는 함수. */
  style?: GeoJsonStyle;
  /** 원본에 담긴 스타일 값(GeoJSON은 `geometry.mantle_properties`의 strokeColor 등)을 쓴다. SDK의 autoStyle. */
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

type Dispatcher = (
  feature: naver.maps.Feature,
) => naver.maps.StyleOptions | undefined;

/**
 * 데이터 레이어마다 하나. 레이어의 스타일 함수(dispatcher)는 하나만 두고, feature 를 올린 컴포넌트
 * (owners)의 style 을 찾아 쓴다. 주인에게 style 이 없으면 아무것도 돌려주지 않아 SDK 가 그 feature 의
 * 스타일(autoStyle 포함)을 그대로 둔다(`_setFeatureStyle`, 3.10.5).
 */
type Registry = {
  owners: Map<naver.maps.Feature, { current: Owner }>;
  dispatcher: Dispatcher;
  /** 이 레이어에서 컴포넌트가 style을 쓴 적이 있는가. 그 뒤로는 style이 없어도 레이어를 되찾는다. */
  styled: boolean;
};
const registries = new WeakMap<naver.maps.Data, Registry>();

function registryOf(data: naver.maps.Data): Registry {
  let registry = registries.get(data);
  if (!registry) {
    const owners: Registry['owners'] = new Map();
    registry = {
      owners,
      dispatcher: (feature) => {
        const style = owners.get(feature)?.current.style;
        return typeof style === 'function' ? style(feature) : style;
      },
      styled: false,
    };
    registries.set(data, registry);
  }
  return registry;
}

/**
 * 컴포넌트의 style 이 바뀌었을 때(올린 feature 가 바뀐 때 포함) 칠한다.
 *
 * 레이어에 dispatcher 가 달려 있으면 이 컴포넌트의 feature 만 칠한다. SDK 의 `Data.setStyle` 은 레이어의
 * 모든 feature 를 다시 칠해서, 컴포넌트마다 부르면 같은 commit 에 마운트한 컴포넌트 수 × feature 수만큼
 * style 함수가 불렸다. 개별로 칠하는 것은 SDK `_setFeatureStyle` 과 같은 공개 호출이다(값이 있을 때만
 * `feature.setStyle`, 3.10.5). `map.data.overrideStyle` 은 레이어 공용 슬롯을 바꾸므로 쓰지 않는다.
 *
 * dispatcher 가 아직 없거나 `map.data.setStyle` 로 바뀌었으면 레이어에 다시 단다. SDK 가 이때 레이어
 * 전체를 칠하므로(이 컴포넌트의 feature 포함) 따로 칠하지 않는다. 지도에서 style 을 쓴 적이 없으면 style
 * 이 없는 컴포넌트는 레이어를 건드리지 않는다(바깥 스타일을 뺏지 않는다).
 */
function applyStyle(
  layer: naver.maps.Data,
  features: readonly naver.maps.Feature[],
  style: GeoJsonStyle | undefined,
) {
  const registry = registryOf(layer);
  if (style === undefined && !registry.styled) return;
  registry.styled = true;
  if (layer.getStyle() !== (registry.dispatcher as unknown)) {
    layer.setStyle(
      registry.dispatcher as unknown as naver.maps.StylingFunction,
    );
    return;
  }
  if (style === undefined) return;
  for (const feature of features) {
    const computed = registry.dispatcher(feature);
    if (computed) feature.setStyle(computed);
  }
}

/** 이벤트 이름과 prop 이름. SDK 이벤트 `property_changed`의 prop은 `onPropertyChanged` 다. */
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

  // style 이 바뀌면 자기 feature 를 다시 칠한다(applyStyle). 인증에 실패한 뒤에는 SDK 의 Feature.setStyle 이
  // 전역 naver.maps 를 읽다 던지므로 칠하지 않는다(sdk/listeners.ts 의 sdkAlive).
  useLayoutEffect(() => {
    ownerRef.current = { style };
    if (!features || !sdkAlive()) return;
    applyStyle(layer, features, style);
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
