import { useLayoutEffect, useRef } from 'react';
import { sdkAlive } from '../sdk/listeners.js';
import { createdOptionsOf } from './created-options.js';

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * 네이버맵 KVO 값 비교. prop 과 SDK 가 가진 값을 값으로 비교한다.
 *
 * - 참조가 같으면 같다.
 * - `equals` 가 있는 SDK 값(LatLng, Point, Size, Bounds)은 그 `equals` 를 쓴다. 한쪽이 리터럴이어도 된다.
 *   SDK 의 LatLng.equals 는 리터럴(`{ lat, lng }`)도 받는다(3.10.5 확인).
 * - KVOArray(`getArray()` 가 있는 값)는 안의 배열로 바꿔 비교한다. SDK 는 path, paths 를 이렇게 감싸 저장한다.
 * - 배열은 원소마다, 일반 객체와 SDK 의 값 객체(padding 의 trbl 등)는 키마다 이 함수로 비교한다.
 * - DOM 노드, 함수, KVO 객체(MapTypeRegistry, 앵커로 쓰는 Marker 등)는 참조로만 비교한다.
 *
 * 그래서 렌더마다 새로 만든 같은 값(인라인 배열, `anchor: new Point(...)` 가 든 icon)은 같다고 본다.
 */
type Equatable = { equals: (v: unknown) => boolean };
type KVOArrayLike = { getArray: () => unknown[] };

function hasEquals(v: unknown): v is Equatable {
  return (
    v !== null &&
    typeof v === 'object' &&
    'equals' in v &&
    typeof (v as Equatable).equals === 'function'
  );
}

function isKVOArray(v: unknown): v is KVOArrayLike {
  return (
    v !== null &&
    typeof v === 'object' &&
    typeof (v as KVOArrayLike).getArray === 'function'
  );
}

/**
 * SDK 의 KVO 객체(MapTypeRegistry, Marker 등). 값이 아니라 정체가 있는 객체라 참조로만 비교한다.
 * 키마다 훑으면 지도·리스너로 이어진 순환 참조를 끝없이 따라간다(3.10.5 MapTypeRegistry 로 확인).
 * KVOArray 는 이보다 먼저 안의 배열로 비교한다.
 */
function isKVOInstance(v: unknown): boolean {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as { bindTo?: unknown }).bindTo === 'function'
  );
}

/** 키마다 비교할 객체. DOM 노드, 배열, 함수, KVO 객체는 아니다. */
function isRecord(v: unknown): v is Record<string, unknown> {
  return (
    typeof v === 'object' &&
    v !== null &&
    !Array.isArray(v) &&
    typeof (v as { nodeType?: unknown }).nodeType !== 'number' &&
    !isKVOInstance(v)
  );
}

export function kvoEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (isKVOArray(a)) return kvoEquals(a.getArray(), b);
  if (isKVOArray(b)) return kvoEquals(a, b.getArray());
  // 양쪽 어느 쪽이든 equals가 있으면 시도. prev=literal, new=LatLng instance처럼 한쪽만
  // SDK 객체일 때(또는 그 반대) false negative를 막는다.
  if (hasEquals(a)) return a.equals(b);
  if (hasEquals(b)) return b.equals(a);
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => kvoEquals(x, b[i]));
  }
  if (isRecord(a) && isRecord(b)) {
    const keys = Object.keys(a);
    return (
      keys.length === Object.keys(b).length &&
      keys.every((key) => Object.hasOwn(b, key) && kvoEquals(a[key], b[key]))
    );
  }
  return false;
}

/**
 * SDK 가 지금 가진 값을 나중에 비교할 수 있게 떠 둔다. SDK 가 같은 객체를 고쳐 쓰면
 * (KVOArray 에 push 등) 참조만 들고 있어서는 바뀐 것을 알 수 없다.
 */
function snapshot(v: unknown): unknown {
  if (isKVOArray(v)) return v.getArray().map(snapshot);
  if (Array.isArray(v)) return v.map(snapshot);
  if (hasEquals(v)) {
    const clone = (v as { clone?: () => unknown }).clone;
    return typeof clone === 'function' ? clone.call(v) : v;
  }
  if (isRecord(v)) {
    return Object.fromEntries(
      Object.entries(v).map(([k, x]) => [k, snapshot(x)]),
    );
  }
  return v;
}

/**
 * React prop → KVO 프로퍼티 단방향 동기화.
 *
 * ## 설계 근거
 *
 * 네이버맵의 KVO set()은 완전 동기이고 배치 처리가 없다.
 * 데스크톱 드래그 시 매 프레임 center_changed + bounds_changed 등이 동기 발화된다.
 *
 * 이전 구현에서 useSyncExternalStore로 KVO를 구독하면:
 * - uncontrolled(value === undefined)에서도 매 프레임 리렌더 발생
 * - NaverMapInner 리렌더 → children(Marker, Circle 등) 전체 리렌더 전파
 * - 17개 useControlledKVO × 매 프레임 = 심각한 퍼포먼스 저하
 *
 * 현재 구현은 KVO를 구독하지 않고, 렌더 시점에 SDK 값을 직접 읽어 비교한다.
 *
 * ## useLayoutEffect를 쓰는 이유
 *
 * KVO setter는 네이버맵의 DOM 상태(타일 위치, 오버레이 위치 등)를 즉시 변경한다.
 * useEffect(paint 후)에서 호출하면 이전 상태가 한 프레임 보인다 (깜빡임).
 * useLayoutEffect(paint 전)에서 호출해야 시각적 일관성이 보장된다.
 *
 * ## deps 생략 이유
 *
 * deps 없이 매 렌더마다 실행한다. 의존 값이 외부 시스템(KVO)의 현재 상태이므로
 * React deps로 표현할 수 없다. KVO get()은 `return this[key]` 한 줄이라 무비용.
 *
 * ## 첫 동기화
 *
 * 컴포넌트 생성자(new navermaps.Marker(options) 등)에서 이미 옵션이 적용된다.
 * 마운트 때는 setter 를 부르지 않고 SDK 가 가진 값만 기록한다. 마운트 뒤에 처음 prop 이 생기면 맞춘다.
 * 생성과 첫 동기화 사이에 prop 이 바뀌었으면 맞춘다(created-options.ts). 생성자가 받은 값과 견주므로
 * SDK 가 값을 바꿔 저장한 prop(minZoom 3 → 6)은 그대로 둔다.
 *
 * ## 되돌림
 *
 * prop 을 준 값은 prop 이 기준이다. 사용자가 Marker 를 끌어 SDK 값이 바뀌면 다음 렌더에서
 * prop 으로 되돌린다(0.3.0 과 같은 동작). 받아들이려면 앱이 이벤트(onDragend 등)로 상태를 갱신한다.
 * prop 이 그대로이고 SDK 값도 마지막으로 맞춘 직후와 같으면 setter 를 부르지 않는다.
 *
 * ## 주의: NaverMap의 center/zoom/bounds에는 이 훅을 사용하지 않는다
 *
 * center/zoom/bounds는 상호 의존적이어서 개별 setter로 처리하면 지도가 튕긴다.
 * NaverMapInner에서 전용 dirty diff + morph/panTo/fitBounds 우선순위로 처리한다.
 */
export function useControlledKVO(
  target: naver.maps.KVO,
  property: string,
  value?: unknown,
  rules?: SyncRules,
): void {
  useControlledProps(target, { [property]: value }, rules);
}

/**
 * 한 prop 의 동기화 상태. 마지막으로 맞춘 prop 과, 그 직후 SDK 가 가진 값. io 는 그 인스턴스의 읽기·쓰기
 * 함수로, 렌더마다 만들지 않으려고 둔다(target 이 바뀌면 다시 만든다).
 */
type Synced = {
  prop: unknown;
  applied: unknown;
  target: naver.maps.KVO;
  io: ReturnType<typeof accessors>;
};

/**
 * 여러 prop 을 한 번에 동기화한다. 규칙은 useControlledKVO 와 같고 layout effect 하나로 돈다.
 * values 의 키는 렌더마다 같아야 한다(컴포넌트마다 정해진 prop 목록).
 *
 * SDK 는 값을 바꿔 저장하기도 해서(path 를 KVOArray 로, minZoom 3 을 6 으로) prop 과 SDK 값을
 * 바로 비교하면 영원히 다르다. 그래서 "SDK 값이 우리가 맞춘 직후와 달라졌는가" 로
 * 바깥 변경(사용자 드래그 등)을 안다.
 */
/**
 * prop 마다 다른 규칙. 둘 다 SDK 가 그 값을 다루는 방식이 다른 prop 에만 쓴다.
 *
 * - `changeOnly`: prop 이 바뀔 때만 맞추고 바깥 변경을 되돌리지 않는다. SDK 가 스스로 값을
 *   되돌리는 일회성 값(Marker 의 animation: DROP 이 끝나면 SDK 가 null 로 바꾼다)에 쓴다.
 * - `writeOnMount`: 마운트 때 생성자 옵션으로 들어가지 않는 값. 마운트 때 SDK 값과 다르면 맞춘다
 *   (NaverMap 의 cursor: 생성자가 cursor 옵션을 읽지 않고 "open" 으로 둔다).
 */
export type SyncRules = {
  changeOnly?: readonly string[];
  writeOnMount?: readonly string[];
};

export function useControlledProps(
  target: naver.maps.KVO,
  values: Record<string, unknown>,
  rules: SyncRules = {},
): void {
  const syncedRef = useRef(new Map<string, Synced>());
  const mountedRef = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const mounting = !mountedRef.current;
    mountedRef.current = true;
    if (!sdkAlive()) return;
    for (const [property, value] of Object.entries(values)) {
      if (value === undefined) continue;
      syncProp(syncedRef.current, target, property, value, {
        mounting,
        changeOnly: rules.changeOnly?.includes(property) ?? false,
        writeOnMount: rules.writeOnMount?.includes(property) ?? false,
      });
    }
  });
}

function syncProp(
  states: Map<string, Synced>,
  target: naver.maps.KVO,
  property: string,
  value: unknown,
  rule: { mounting: boolean; changeOnly: boolean; writeOnMount: boolean },
): void {
  const synced = states.get(property);
  const io =
    synced && synced.target === target
      ? synced.io
      : accessors(target, property);
  const current = io.read();

  if (synced === undefined) {
    // 마운트 때는 생성자 옵션으로 이미 들어갔으므로 SDK 가 가진 값을 기록만 한다.
    // SDK 가 값을 바꿔 저장했어도(minZoom 3 → 6) 다시 부르지 않는다.
    // 마운트 뒤에 처음 prop 이 생겼으면 맞춘다. 생성 뒤에 바뀐 prop 도 맞춘다.
    const createdWith = createdOptionsOf(target);
    const changedSinceCreated =
      createdWith !== undefined && !kvoEquals(createdWith[property], value);
    if (
      (!rule.mounting || rule.writeOnMount || changedSinceCreated) &&
      !kvoEquals(current, value)
    )
      io.write(value);
    states.set(property, {
      prop: value,
      applied: snapshot(io.read()),
      target,
      io,
    });
    return;
  }

  const propChanged = !kvoEquals(synced.prop, value);
  const changedOutside =
    !rule.changeOnly && !kvoEquals(current, synced.applied);
  if (!propChanged && !changedOutside) {
    if (synced.target !== target) synced.io = io;
    synced.target = target;
    return;
  }

  // prop 이 바뀌었거나, 바깥에서 SDK 값을 바꿨으면 prop 으로 맞춘다(되돌림).
  // 0.3.0 과 같은 동작이다. 바깥 변경을 받아들이려면 앱이 이벤트로 상태를 갱신해 prop 을 바꾼다.
  if (!kvoEquals(current, value)) io.write(value);
  states.set(property, {
    prop: value,
    applied: snapshot(io.read()),
    target,
    io,
  });
}

/**
 * setter/getter 우선순위 (높은 순):
 *   1. 전용 setX/getX 메서드 — Map.setMapTypeId처럼 추가 부수효과 수행 (registry 전환 등)
 *   2. setOptions(key, value)/getOptions(key) — Map은 옵션을 _mapOptions(별도 KVO)에
 *      저장하므로 이 경로를 통해서만 SDK가 보는 실제 값이 바뀐다. Marker도 동일 시그니처.
 *   3. set(key, value)/get(key) — 자체 KVO 직접 접근 (위 둘 다 없을 때)
 *
 * setMapTypeId는 mapTypes.setSelectedTypeId를 호출해서 registry를 전환.
 * setOptions로 mapTypeId를 바꾸면 mapOptions의 KVO만 갱신되고 registry는 안 바뀐다.
 * 따라서 전용 setter 우선이 정답.
 *
 * 읽기와 쓰기 경로는 따로 고른다. "전용 getter는 없지만 전용 setter는 있는" prop 에서는
 * 읽기는 getOptions/get, 쓰기는 setX 를 탄다. 현재 SDK 에서는 같은 KVO 슬롯을 보므로 일관되지만,
 * SDK 가 setX 와 setOptions/set 을 같은 슬롯에 라우팅한다는 전제에 의존한다.
 *
 * 경로는 이름으로 고르므로 SDK 에 setX 가 새로 생기면 조용히 그쪽으로 옮겨 간다. 클래스별 경로와 경로마다
 * 다른 뜻은 실제 SDK 에서 `e2e/scenarios/sdk-routes.ts` 가 지킨다. setOptions 로 묶지 않는 이유도 거기 있다.
 */
export function syncRoute(target: object, property: string) {
  const t = target as Record<string, unknown>;
  const hasOptions =
    typeof t.setOptions === 'function' && typeof t.getOptions === 'function';
  const hasSetter = typeof t[`set${capitalize(property)}`] === 'function';
  const hasGetter = typeof t[`get${capitalize(property)}`] === 'function';
  return {
    write: hasSetter ? 'setX' : hasOptions ? 'setOptions' : 'set',
    read: hasGetter ? 'getX' : hasOptions ? 'getOptions' : 'get',
  } as const;
}

function accessors(target: naver.maps.KVO, property: string) {
  const setterName = `set${capitalize(property)}`;
  const getterName = `get${capitalize(property)}`;
  const t = target as unknown as Record<string, unknown>;
  const route = syncRoute(target, property);
  const hasSetter = route.write === 'setX';
  const hasGetter = route.read === 'getX';
  const hasOptions =
    route.write === 'setOptions' || route.read === 'getOptions';
  return {
    read(): unknown {
      if (hasGetter) return (t[getterName] as () => unknown).call(target);
      if (hasOptions)
        return (t.getOptions as (key: string) => unknown).call(
          target,
          property,
        );
      return target.get(property);
    },
    write(value: unknown): void {
      if (hasSetter)
        (t[setterName] as (v: unknown) => void).call(target, value);
      else if (hasOptions)
        (t.setOptions as (key: string, value: unknown) => void).call(
          target,
          property,
          value,
        );
      else target.set(property, value);
    },
  };
}
