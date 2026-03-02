import { useCallback, useSyncExternalStore } from 'react';

export function useKVO<T>(target: naver.maps.KVO, property: string): T {
  const subscribe = useCallback(
    (callback: () => void) => {
      const listener = naver.maps.Event.addListener(
        target,
        `${property}_changed`,
        callback,
      );
      return () => {
        naver.maps.Event.removeListener(listener);
      };
    },
    [target, property],
  );

  const getSnapshot = useCallback(
    () => target.get(property) as T,
    [target, property],
  );

  return useSyncExternalStore(subscribe, getSnapshot);
}
