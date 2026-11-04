'use client';

import type { Ref } from 'react';
import { useEffect, useImperativeHandle } from 'react';
import { useNavermaps } from './hooks/use-navermaps.js';
import { useMap } from './hooks/use-map.js';
import { useControlledProps } from './hooks/use-controlled-kvo.js';
import { onMap, onReadyMap, useSdkInstance } from './lifetime.js';
import { omitUndefined } from './utils/omit-undefined.js';
import { addMapListener, removeMapListener } from './utils/sdk.js';
import type { MapListener } from './utils/sdk.js';
import { changedProp, eventProp } from './types/overlay-events.js';
import type { PointerEventHandler } from './types/overlay-events.js';

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
  /** 만든 직후 할 일. */
  afterCreate?: (instance: T, props: P) => void;
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
};

type Overlay = naver.maps.KVO & {
  setMap: (map: naver.maps.Map | null) => void;
};

function pick<P>(props: P, keys: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) out[key] = (props as Record<string, unknown>)[key];
  return out;
}

/** spec 으로 오버레이 컴포넌트를 만든다. */
export function defineOverlay<P extends object, T extends Overlay>(
  name: string,
  spec: OverlaySpec<P, T>,
) {
  function OverlayComponent({ ref, ...rest }: P & { ref?: Ref<T> }) {
    const props = rest as P;
    const navermaps = useNavermaps();
    const map = useMap();
    const attachTo = spec.waitForReadyMap ? onReadyMap : onMap;
    const instance = useSdkInstance(
      attachTo(map, () => {
        const created = spec.create(
          navermaps,
          omitUndefined({
            map: spec.waitForReadyMap ? undefined : map,
            ...pick(props, spec.options),
            ...spec.initial?.(props),
            ...spec.derived?.(props),
          }),
          props,
        );
        spec.afterCreate?.(created, props);
        return created;
      }),
      spec.keys?.(props),
    );

    useImperativeHandle(ref, () => instance!, [instance]);

    if (!instance) return null;
    return <OverlayBindings instance={instance} props={props} spec={spec} />;
  }
  OverlayComponent.displayName = name;
  return OverlayComponent;
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
  useOverlayEvents(instance, props, spec.events);
  useOverlayEvents(instance, props, [
    ...(spec.changes ?? []).map(
      (k) => [`${k}_changed`, changedProp(k)] as const,
    ),
    ...(spec.otherEvents ?? []),
  ]);
  return null;
}

/**
 * 이벤트 prop 을 SDK 리스너로 붙인다. 핸들러가 바뀌면 그 묶음을 다시 붙인다.
 * 이름만 주면 prop 은 `on` + 이름(`click` → `onClick`), `[이벤트, prop]` 이면 그 prop 이다.
 * events 는 렌더마다 같은 목록이어야 한다.
 */
export function useOverlayEvents(
  target: object,
  props: object,
  events: readonly (string | readonly [event: string, prop: string])[],
): void {
  const pairs = events.map((e) =>
    typeof e === 'string' ? ([e, eventProp(e)] as const) : e,
  );
  const handlers = pairs.map(
    ([, prop]) =>
      (props as Record<string, unknown>)[prop] as
        | PointerEventHandler
        | undefined,
  );
  useEffect(() => {
    const listeners: MapListener[] = [];
    pairs.forEach(([event], i) => {
      const handler = handlers[i];
      if (handler) listeners.push(addMapListener(target, event, handler));
    });
    return () => listeners.forEach((l) => removeMapListener(l));
    // 핸들러 목록을 펼쳐 deps 로 쓴다. 길이는 events 로 정해져 렌더마다 같다.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [target, ...handlers]);
}
