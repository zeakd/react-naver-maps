import { useEffect, useRef } from 'react';

/**
 * 네이버맵 네이티브 이벤트를 React 콜백으로 연결한다.
 *
 * on* props로 처리할 수 없는 이벤트(KVO changed, 생명주기 등)에 사용하는 escape hatch.
 * 인라인 함수를 전달해도 리스너 재구독이 발생하지 않는다 (useEffectEvent 패턴).
 *
 * ```tsx
 * useListener(map, 'idle', () => setIsIdle(true));
 * useListener(overlay, 'position_changed', onPositionChanged);
 * ```
 */
export function useListener(
  target: naver.maps.KVO | null,
  eventName: string,
  listener: ((...args: unknown[]) => void) | undefined,
): void {
  const listenerRef = useRef(listener);
  listenerRef.current = listener;

  useEffect(() => {
    if (!target || !listenerRef.current) return;

    const handle = naver.maps.Event.addListener(
      target,
      eventName,
      (...args: unknown[]) => listenerRef.current?.(...args),
    );
    return () => naver.maps.Event.removeListener(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, eventName, listener !== undefined]);
}
