import {
  useInsertionEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { kvoEquals } from './use-controlled-kvo.js';
import { useStableValue } from './use-stable-value.js';
import {
  addMapListener,
  clearMapListeners,
  removeMapListener,
  sdkAlive,
} from '../sdk/listeners.js';
import type { MapListener } from '../sdk/listeners.js';

/**
 * SDK 인스턴스(지도, 오버레이, 레이어)를 React 수명에 맞추는 규칙. 컴포넌트마다 따로 두지 않고
 * 여기서만 정한다.
 *
 * | React 에서 일어나는 일                         | 인스턴스          |
 * |----------------------------------------------|------------------|
 * | 처음 마운트                                     | create           |
 * | 숨김: Suspense 재중단, Activity hidden, StrictMode 재실행 | detach (뗀다)     |
 * | 다시 보임                                       | attach (같은 인스턴스를 다시 붙인다) |
 * | keys 가 바뀜                                    | dispose 후 create |
 * | 진짜 언마운트, 숨긴 채 제거                       | dispose (버린다)   |
 *
 * 떼기·붙이기는 layout effect 의 cleanup·setup 이다. React 는 트리를 숨길 때도 layout effect 를
 * 정리하므로 여기서 인스턴스를 버리면 숨겼다 보일 때 새로 만들게 된다. 지도라면 새 지도가 생기고
 * 자식 오버레이는 옛 지도에 남았다(e2e 시나리오 "suspend 했다 풀려도", "Activity 로 지도를").
 *
 * 버리기는 useInsertionEffect 의 cleanup 이다. React 19.3.1 에서 잰 바로는 이 cleanup 은
 * 숨김(Suspense 재중단, Activity hidden)과 StrictMode 재실행에서는 돌지 않고, 진짜 언마운트와
 * 숨긴 채 제거될 때만 돈다. React 문서가 약속한 동작은 아니다. React 가 바꾸면 e2e 수명
 * 시나리오가 깨진다.
 */
export type SdkInstanceSpec<T> = {
  create: () => T;
  /** 숨겼다 다시 보일 때. 없으면 아무것도 하지 않는다. */
  attach?: (instance: T) => void;
  detach: (instance: T) => void;
  dispose: (instance: T) => void;
};

/**
 * spec 에 따라 인스턴스를 만들고 돌려준다. 첫 layout effect 전에는 null 이다.
 *
 * keys 는 값으로 비교한다. 바뀌면 옛 인스턴스를 버리고 새로 만든다(GroundOverlay 의 url 등).
 * spec 의 함수는 매 렌더 최신 것을 쓴다.
 */
export function useSdkInstance<T>(
  spec: SdkInstanceSpec<T>,
  keys: readonly unknown[] = [],
): T | null {
  const [instance, setInstance] = useState<T | null>(null);
  // 다시 붙인 뒤 한 번 다시 렌더한다. SDK 는 떼고 붙이며 옵션을 되돌리기도 해서(DrawingManager 의
  // drawingMode 가 HAND 로, 3.10.5 실측) 자식의 값 동기화가 다시 돌아 prop 으로 맞춰야 한다. StrictMode
  // 재실행은 렌더 없이 effect 만 다시 돈다.
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const currentRef = useRef<{ instance: T; keys: readonly unknown[] } | null>(
    null,
  );
  const specRef = useRef(spec);

  // 최신 spec 을 effect 보다 먼저 넣는다. insertion effect 는 layout effect 보다 먼저 돈다.
  useInsertionEffect(() => {
    specRef.current = spec;
  });

  // keys 를 값으로 안정화한다. 렌더마다 새로 만든 같은 값(인라인 bounds 등)이면 지난 배열을 그대로
  // 써서 effect 가 다시 돌지 않게 한다. 그러지 않으면 렌더마다 떼었다 붙였다(setMap(null), setMap(map)).
  const stableKeys = useStableValue(keys);
  // stableKeys 가 바뀔 때만 다시 돈다(배열을 그대로 deps 로 넘긴다). 그 밖에 effect 가 다시 도는 것은
  // 숨겼다 보일 때와 StrictMode 재실행이다.
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!sdkAlive()) return;
    const current = currentRef.current;
    let next: T;
    if (current && kvoEquals(current.keys, stableKeys)) {
      next = current.instance;
      specRef.current.attach?.(next);
      rerender();
    } else {
      if (current) specRef.current.dispose(current.instance);
      next = specRef.current.create();
      currentRef.current = { instance: next, keys: stableKeys };
    }
    setInstance(next);
    return () => {
      if (sdkAlive()) specRef.current.detach(next);
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, stableKeys);

  useInsertionEffect(
    () => () => {
      const current = currentRef.current;
      currentRef.current = null;
      if (current && sdkAlive()) specRef.current.dispose(current.instance);
    },
    [],
  );

  return instance;
}

type MapAttachable = { setMap: (map: naver.maps.Map | null) => void };

/**
 * 인스턴스를 붙이는 방법. 없으면 `setMap(host)`. 붙일 때마다(처음, 숨겼다 다시 보일 때, StrictMode
 * 재실행) 같은 방법을 쓴다. 이것을 주면 create 는 붙이지 않은 인스턴스를 돌려준다.
 * 예: Marker 는 clickable 을 켠 채 붙여야 클릭을 받는다.
 * onReadyHost 에서는 지도 init 뒤로 미뤄져 등록한 렌더보다 늦게 불린다. prop 을 읽어야 하면 렌더의 값을
 * 붙잡지 말고 최신 값(ref, use-latest.ts)을 읽는다.
 */
export type AttachTo<T> = (instance: T, host: naver.maps.Map) => void;

/**
 * 지도에 setMap 으로 붙는 인스턴스의 떼기·붙이기·버리기. create 는 지도에 붙인 채로 돌려준다
 * (attachTo 를 주면 붙이지 않은 채로 돌려주고 attachTo 로 붙인다).
 * 버릴 때는 사용자가 addListener 로 단 리스너도 지운다.
 */
export function onMap<T extends MapAttachable>(
  map: naver.maps.Map,
  create: () => T,
  attachTo?: AttachTo<T>,
): SdkInstanceSpec<T> {
  if (attachTo) {
    return {
      create: () => {
        const instance = create();
        attachTo(instance, map);
        return instance;
      },
      attach: (instance) => attachTo(instance, map),
      detach: (instance) => instance.setMap(null),
      dispose: (instance) => {
        clearMapListeners(instance);
        instance.setMap(null);
      },
    };
  }
  return {
    create,
    attach: (instance) => instance.setMap(map),
    detach: (instance) => instance.setMap(null),
    dispose: (instance) => {
      clearMapListeners(instance);
      instance.setMap(null);
    },
  };
}

type ReadyMap = naver.maps.Map & { isReady?: boolean };

/**
 * onMap 과 같되 지도가 준비(init)된 뒤에 붙인다. 준비 전에 붙이면 SDK 가 조용히 무시하는
 * 인스턴스가 있다: CustomControl 은 setMap 을 거절하고(콘솔에 다시 하라고만 남김),
 * visualization 의 HeatMap 은 붙지만 그리지 않는다(3.10.5 실측). create 는 지도에 붙이지 않은
 * 인스턴스를 돌려준다.
 */
export function onReadyMap<T extends MapAttachable>(
  map: naver.maps.Map,
  create: () => T,
  attachTo?: AttachTo<T>,
): SdkInstanceSpec<T> {
  return onReadyHost(map, () => !!(map as ReadyMap).isReady, create, attachTo);
}

/**
 * onReadyMap 을 붙일 곳과 준비 판정으로 일반화한 것. 거리뷰(Panorama)도 init 뒤에 붙인다.
 * 준비 판정은 붙일 곳마다 다르다(Map 은 isReady 속성, Panorama 는 Panorama 컴포넌트가 기록).
 */
/**
 * 준비(init)를 기다리는 인스턴스와 그 init 리스너. 모듈에 하나만 둔다. onReadyHost 는 렌더마다
 * 새 spec 을 만들고 useSdkInstance 는 최신 spec 으로 뗀다. spec 마다 따로 두면 init 전에 내리거나
 * 숨길 때 앞 렌더의 spec 이 단 리스너를 찾지 못해, init 이 오면 내린 인스턴스가 지도에 붙었다
 * (e2e "init 전에 올렸다 내린 HeatMap 과 CustomControl").
 */
const waits = new WeakMap<object, MapListener>();

export function onReadyHost<T extends MapAttachable>(
  host: naver.maps.Map,
  isReady: () => boolean,
  create: () => T,
  attachTo: AttachTo<T> = (instance, to) => instance.setMap(to),
): SdkInstanceSpec<T> {
  const attach = (instance: T) => {
    if (isReady()) {
      attachTo(instance, host);
      return;
    }
    // init 은 한 번만 기다린다. 붙인 뒤에도 리스너가 남으면 지도가 사는 동안 버린 인스턴스를 붙잡는다.
    const wait = addMapListener(host, 'init', () => {
      removeMapListener(wait);
      waits.delete(instance);
      attachTo(instance, host);
    });
    waits.set(instance, wait);
  };
  const detach = (instance: T) => {
    const wait = waits.get(instance);
    if (wait) {
      removeMapListener(wait);
      waits.delete(instance);
    }
    instance.setMap(null);
  };
  return {
    create: () => {
      const instance = create();
      attach(instance);
      return instance;
    },
    attach,
    detach,
    dispose: (instance) => {
      detach(instance);
      clearMapListeners(instance);
    },
  };
}
