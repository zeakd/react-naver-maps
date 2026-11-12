import type { Ref } from 'react';
import { useImperativeHandle, useRef } from 'react';
import { useSdkInstance } from '../binding/lifetime.js';
import { clearMapListeners } from '../sdk/listeners.js';

/**
 * 네이버맵 오버레이 인스턴스를 React 생명주기에 연결한다.
 *
 * 바닐라로 만든 OverlayView 상속 객체를 React 컴포넌트에서 사용할 수 있게 한다.
 * mount 시 factory()로 인스턴스 생성, unmount 시 clearInstanceListeners + setMap(null).
 *
 * ```tsx
 * const overlay = useOverlay(() => new MyOverlay({ position, map }));
 * ```
 *
 * ## useLayoutEffect를 쓰는 이유
 *
 * useEffect(paint 후)에서 인스턴스를 생성하면:
 * 1. 첫 렌더에서 null 반환 → 빈 화면이 한 프레임 보임
 * 2. useEffect 실행 → 인스턴스 생성 → setInstance → 두 번째 렌더
 *
 * useLayoutEffect(paint 전)에서 생성하면 빈 프레임 없이 즉시 렌더.
 * React 메인테이너 권고: "외부 객체 생성은 useState 동기 초기화 대신
 * useLayoutEffect 사용" (StrictMode에서 useState 초기화가 2번 실행되어
 * 인스턴스 2개 생성 문제 방지).
 *
 * ## 수명
 *
 * `lifetime.ts` 의 규칙을 따른다. React 가 트리를 숨길 때(Suspense 재중단, Activity hidden,
 * StrictMode 재실행)는 지도에서 떼고(setMap(null)) 다시 보일 때 같은 인스턴스를 같은 지도에
 * 붙인다. 진짜 언마운트에서만 버린다.
 *
 * 네이버맵 오버레이에는 destroy()가 없다. 버릴 때는 setMap(null)과, 사용자가 addListener로
 * 등록한 리스너를 지우는 clearInstanceListeners()를 한다.
 *
 * ## factory 의존성
 *
 * factory는 마운트 시 1회만 호출된다. 의존성 변경에 의한 재생성은 지원하지 않는다.
 * 재생성이 필요한 GroundOverlay 등은 React key prop으로 제어한다.
 */
type Attachable = {
  getMap?: () => unknown;
  setMap?: (map: unknown) => void;
};

export function useOverlay<T>(factory: () => T, ref?: Ref<T>): T | null {
  // 숨길 때 붙어 있던 지도. 다시 보일 때 그 지도에 붙인다.
  const detachedFromRef = useRef<unknown>(null);
  const instance = useSdkInstance<T>({
    create: factory,
    attach: (inst) => {
      const map = detachedFromRef.current;
      detachedFromRef.current = null;
      if (map) (inst as Attachable).setMap?.(map);
    },
    detach: (inst) => {
      const o = inst as Attachable;
      detachedFromRef.current = o.getMap?.() ?? null;
      o.setMap?.(null);
    },
    dispose: (inst) => {
      clearMapListeners(inst);
      (inst as Attachable).setMap?.(null);
    },
  });

  useImperativeHandle(ref, () => instance!, [instance]);

  return instance;
}
