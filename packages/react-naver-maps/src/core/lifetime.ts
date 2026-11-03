import { useInsertionEffect, useLayoutEffect, useRef, useState } from 'react';
import { kvoEquals } from './hooks/use-controlled-kvo.js';
import { clearMapListeners, sdkAlive } from './utils/sdk.js';

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
  const currentRef = useRef<{ instance: T; keys: readonly unknown[] } | null>(
    null,
  );
  const specRef = useRef(spec);

  // 최신 spec 을 effect 보다 먼저 넣는다. insertion effect 는 layout effect 보다 먼저 돈다.
  useInsertionEffect(() => {
    specRef.current = spec;
  });

  // keys 가 바뀔 때만 다시 돈다(배열을 그대로 deps 로 넘긴다). 값 비교는 안에서 한다.
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!sdkAlive()) return;
    const current = currentRef.current;
    let next: T;
    if (current && kvoEquals(current.keys, keys)) {
      next = current.instance;
      specRef.current.attach?.(next);
    } else {
      if (current) specRef.current.dispose(current.instance);
      next = specRef.current.create();
      currentRef.current = { instance: next, keys };
    }
    setInstance(next);
    return () => {
      if (sdkAlive()) specRef.current.detach(next);
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, keys);

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
 * 지도에 setMap 으로 붙는 인스턴스의 떼기·붙이기·버리기. create 는 지도에 붙인 채로 돌려준다.
 * 버릴 때는 사용자가 addListener 로 단 리스너도 지운다.
 */
export function onMap<T extends MapAttachable>(
  map: naver.maps.Map,
  create: () => T,
): SdkInstanceSpec<T> {
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
