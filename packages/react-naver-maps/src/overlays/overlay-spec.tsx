'use client';

import type { Ref } from 'react';
import { useEffect, useImperativeHandle, useLayoutEffect } from 'react';
import { useNavermaps } from '../hooks/use-navermaps.js';
import { useLatest } from '../binding/use-latest.js';
import { useOverlayHost } from './use-overlay-host.js';
import { useControlledProps } from '../binding/use-controlled-kvo.js';
import { onMap, onReadyHost, useSdkInstance } from '../binding/lifetime.js';
import type { AttachTo } from '../binding/lifetime.js';
import { resolveConstants } from '../sdk/constants.js';
import type { ConstantPaths } from '../sdk/constants.js';
import { omitUndefined } from '../binding/omit-undefined.js';
import { pick } from '../binding/pick.js';
import {
  extraSdkOptions,
  handledProps,
  setExtraSdkOptions,
  useExtraSdkOptions,
} from '../binding/extra-sdk-options.js';
import { addMapListener, removeMapListener } from '../sdk/listeners.js';
import type { MapListener } from '../sdk/listeners.js';
import { changedProp, eventProp } from './overlay-events.js';
import type { PointerEventHandler } from './overlay-events.js';

/**
 * 지도에 setMap 으로 붙는 오버레이를 표 하나로 정한다. 컴포넌트는 `defineOverlay` 가 만든다.
 *
 * 한 prop 은 생성자 옵션이자 controlled 값이다(SDK 옵션 이름과 prop 이름이 같다). 처음 값만
 * 쓰는 `defaultX` 는 `initial`, prop 에서 계산하는 값(도형 clickable)은 `derived` 에 둔다.
 * 수명은 lifetime.ts, 값 동기화는 useControlledProps 규칙을 따른다.
 */
export type OverlaySpec<P, T> = {
  /** 생성자. options 에는 map 이 들어 있다. 생성자 인자가 따로 있으면 props 에서 읽는다. */
  create: (
    navermaps: typeof naver.maps,
    options: Record<string, unknown>,
    props: P,
  ) => T;
  /**
   * 바뀌면 인스턴스를 다시 만드는 값(setter 가 없는 생성자 인자). 값으로 비교한다.
   * 예: GroundOverlay 의 url, bounds.
   */
  keys?: (props: P) => readonly unknown[];
  /** 생성자 옵션으로 넘기고 이후 controlled 로 맞추는 prop. */
  options: readonly (keyof P & string)[];
  /**
   * options 중 prop 이 바뀔 때만 맞추는 값(useControlledProps 의 changeOnly). SDK 가 스스로
   * 되돌리는 일회성 값이다. 예: Marker 의 animation.
   */
  changeOnly?: readonly (keyof P & string)[];
  /** 생성할 때만 쓰는 값. options 의 값보다 우선한다(`position: props.position ?? props.defaultPosition`). */
  initial?: (props: P) => Record<string, unknown>;
  /** prop 에서 계산해 controlled 로 맞추는 값. */
  derived?: (props: P) => Record<string, unknown>;
  /** 이름으로도 받는 SDK 상수 자리(sdk/constants.ts). 예: Marker 의 `animation: 'BOUNCE'`. */
  constants?: ConstantPaths;
  /** 만든 직후 할 일. */
  afterCreate?: (instance: T, props: P) => void;
  /**
   * 붙이는 방법(lifetime.ts AttachTo). 없으면 생성자에 map 을 넣어 붙이고, 다시 붙일 때 setMap 한다.
   * 주면 생성자에는 map 을 넣지 않고 붙일 때마다 이것을 부른다.
   */
  attachTo?: AttachTo<T>;
  /**
   * 표로 나타내지 못하는 동기화(인자 둘인 SDK 메서드 등). OverlayBindings 안에서 훅으로 부른다.
   * 예: HeatMap 의 setColorMap(colorMap, inReverse).
   */
  sync?: (instance: T, props: P) => void;
  /** 이 오버레이가 내는 포인터 이벤트. `on` + 이름 prop 으로 받는다. */
  events: readonly string[];
  /**
   * 공식 문서 Events 에 있는 KVO 값 변경 이벤트의 키. `position` 이면 `position_changed` 를
   * `onPositionChanged(value)` 로 받는다.
   */
  changes?: readonly string[];
  /** 그 밖의 이벤트와 prop 이름. 예: Marker 의 `['icon_loaded', 'onIconLoaded']`. */
  otherEvents?: readonly (readonly [event: string, prop: string])[];
  /** 지도가 준비(init)된 뒤에 붙여야 하는 오버레이(lifetime.ts onReadyMap). create 에 map 을 넣지 않는다. */
  waitForReadyMap?: boolean;
  /**
   * 목록에 없는 SDK 옵션을 받는다(`binding/extra-sdk-options.ts`). SDK 에 공개 `setOptions` 가 있는
   * 오버레이만 켠다. `ownProps` 는 options·initial·derived 밖에서 컴포넌트가 처리하는 prop 이다.
   * 빠뜨리면 그 prop 이 SDK 로 샌다.
   */
  extraOptions?: { ownProps?: readonly (keyof P & string)[] };
  /**
   * Panorama(거리뷰) 안에서도 쓸 수 있다. SDK 가 거리뷰에 붙는 것을 받는 오버레이만 켠다(Marker).
   * 거리뷰에는 준비(init) 뒤에 붙인다.
   */
  panorama?: boolean;
};

type Overlay = naver.maps.KVO & {
  setMap: (map: naver.maps.Map | null) => void;
};

/** spec 으로 오버레이 컴포넌트를 만든다. */
export function defineOverlay<P extends object, T extends Overlay>(
  name: string,
  spec: OverlaySpec<P, T>,
) {
  function OverlayComponent({ ref, ...rest }: P & { ref?: Ref<T> }) {
    const navermaps = useNavermaps();
    const props = resolveConstants(navermaps, rest as P, spec.constants, name);
    const host = useOverlayHost();
    if (host.kind === 'panorama' && !spec.panorama) {
      throw new Error(
        `${name} 는 Panorama 안에서 쓸 수 없습니다(SDK 가 거리뷰에 붙이지 않는다).`,
      );
    }
    const map = host.target;
    const waitForReady = spec.waitForReadyMap || host.kind === 'panorama';
    const make = () => {
      const created = spec.create(
        navermaps,
        omitUndefined({
          ...extraOptionsOf(props, spec),
          map: waitForReady || spec.attachTo ? undefined : map,
          ...pick(props, spec.options),
          ...spec.initial?.(props),
          ...spec.derived?.(props),
        }),
        props,
      );
      spec.afterCreate?.(created, props);
      return created;
    };
    const instance = useSdkInstance(
      waitForReady
        ? onReadyHost(map, host.isReady, make, spec.attachTo)
        : onMap(map, make, spec.attachTo),
      spec.keys?.(props),
    );

    useImperativeHandle(ref, () => instance!, [instance]);

    if (!instance) return null;
    return <OverlayBindings instance={instance} props={props} spec={spec} />;
  }
  OverlayComponent.displayName = name;
  return OverlayComponent;
}

/** spec 마다 처리하는 prop 이름. initial·derived 가 돌려주는 키는 렌더마다 같다. */
const handledBySpec = new WeakMap<object, ReadonlySet<string>>();

function extraOptionsOf<P extends object, T>(
  props: P,
  spec: OverlaySpec<P, T>,
): Record<string, unknown> {
  if (!spec.extraOptions) return {};
  let handled = handledBySpec.get(spec);
  if (!handled) {
    handled = handledProps([
      ...spec.options,
      ...Object.keys(spec.initial?.(props) ?? {}),
      ...Object.keys(spec.derived?.(props) ?? {}),
      ...(spec.extraOptions.ownProps ?? []),
    ]);
    handledBySpec.set(spec, handled);
  }
  return extraSdkOptions(props, handled);
}

function OverlayBindings<P extends object, T extends Overlay>({
  instance,
  props,
  spec,
}: {
  instance: T;
  props: P;
  spec: OverlaySpec<P, T>;
}) {
  useControlledProps(
    instance,
    {
      ...pick(props, spec.options),
      ...spec.derived?.(props),
    },
    { changeOnly: spec.changeOnly },
  );
  useExtraSdkOptions(
    instance,
    extraOptionsOf(props, spec),
    spec.extraOptions ? setExtraSdkOptions : undefined,
  );
  spec.sync?.(instance, props);
  useOverlayEvents(instance, props, eventsOf(spec));
  return null;
}

/** 표의 이벤트 목록(포인터 이벤트, 값 변경 이벤트, 그 밖). 표마다 한 번만 만든다(렌더마다 만들지 않는다). */
const specEvents = new WeakMap<object, EventList>();
function eventsOf<P, T>(spec: OverlaySpec<P, T>): readonly EventDecl<T>[] {
  let events = specEvents.get(spec) as readonly EventDecl<T>[] | undefined;
  if (!events) {
    events = [
      ...spec.events,
      ...(spec.changes ?? []).map(
        (k) => [`${k}_changed`, changedProp(k)] as const,
      ),
      ...(spec.otherEvents ?? []),
    ];
    specEvents.set(spec, events as EventList);
  }
  return events;
}

/**
 * 이벤트 prop 하나.
 * - 이름만: prop 은 `on` + 이름(`click` → `onClick`), 핸들러는 SDK 가 넘긴 인자를 그대로 받는다.
 * - `[이벤트, prop]`: prop 이름을 정한다.
 * - `[이벤트, prop, read]`: 핸들러가 받을 인자를 이벤트 때마다 SDK 에서 읽는다(`zoom_changed` 에
 *   `map.getZoom()` 등). read 는 이벤트의 대상과 SDK 가 넘긴 인자를 받는다.
 */
export type EventDecl<T = never> =
  | string
  | readonly [event: string, prop: string]
  | readonly [
      event: string,
      prop: string,
      read: (target: T, ...args: unknown[]) => unknown[],
    ];

// 대상 타입을 지운 목록. read 의 인자는 반공변이라 어떤 EventDecl<T> 도 EventDecl<never> 에 들어간다.
type EventList = readonly EventDecl<never>[];
type Normalized = readonly (readonly [
  event: string,
  prop: string,
  read: ((target: never, ...args: unknown[]) => unknown[]) | undefined,
])[];

/** 이벤트 목록을 [이벤트, prop, read] 로. 같은 목록(참조)이면 한 번만 바꾼다. */
const normalized = new WeakMap<EventList, Normalized>();
function pairsOf(events: EventList): Normalized {
  let pairs = normalized.get(events);
  if (!pairs) {
    pairs = events.map((e) =>
      typeof e === 'string'
        ? ([e, eventProp(e), undefined] as const)
        : ([e[0], e[1], e[2]] as const),
    );
    normalized.set(events, pairs);
  }
  return pairs;
}

/**
 * 이벤트 prop 을 SDK 리스너로 붙인다(목록의 모양은 EventDecl). 리스너는 핸들러가 생기거나 없어질 때만
 * 붙이고 떼며, 붙인 리스너는 최신 핸들러를 부른다. target 이 아직 없으면(인스턴스를 만들기 전) 붙이지
 * 않는다. events 는 렌더마다 같은 목록이어야 한다(표의 상수면 정규화도 한 번만 한다).
 * `timing: 'layout'` 은 paint 전에 붙인다(인스턴스를 만들며 바로 내는 이벤트를 놓치지 않게, NaverMap 의
 * init 등). 호출마다 고정값이어야 한다.
 */
export function useOverlayEvents<T extends object>(
  target: T | null,
  props: object,
  events: readonly EventDecl<NoInfer<T>>[],
  timing: 'paint' | 'layout' = 'paint',
): void {
  const useTimedEffect = timing === 'layout' ? useLayoutEffect : useEffect;
  // 목록이 같은 참조면(표의 상수) 짝을 다시 만들지 않는다. 렌더마다 새 목록이면 매번 만든다.
  const pairs = pairsOf(events);
  const handlers = pairs.map(
    ([, prop]) =>
      (props as Record<string, unknown>)[prop] as
        | PointerEventHandler
        | undefined,
  );
  // 리스너는 핸들러가 생기거나 없어질 때만 붙이고 뗀다. 핸들러가 바뀌기만 하면(인라인 함수) 붙인 리스너가
  // 최신 핸들러를 부른다(binding/use-latest.ts).
  const latest = useLatest(handlers);
  const present = handlers.map((h) => h !== undefined);
  useTimedEffect(() => {
    if (!target) return;
    const listeners: MapListener[] = [];
    pairs.forEach(([event, , read], i) => {
      if (!present[i]) return;
      listeners.push(
        addMapListener(target, event, (...args: unknown[]) =>
          (latest.current[i] as ((...a: unknown[]) => void) | undefined)?.(
            ...(read ? read(target as never, ...args) : args),
          ),
        ),
      );
    });
    return () => listeners.forEach((l) => removeMapListener(l));
    // 있음·없음 목록을 펼쳐 deps 로 쓴다. 길이는 events 로 정해져 렌더마다 같다.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [target, ...present]);
}
