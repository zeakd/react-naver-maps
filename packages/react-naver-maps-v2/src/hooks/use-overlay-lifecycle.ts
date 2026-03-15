import type { Ref } from 'react';
import { useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';

/**
 * 오버레이 생명주기 관리 훅.
 *
 * mount: factory() 호출 → 인스턴스 생성
 * unmount: clearInstanceListeners + setMap(null)
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
 * ## cleanup
 *
 * 네이버맵 오버레이에는 destroy()가 없다.
 * setMap(null)이 유일한 공식 정리 방법이지만, 사용자가 addListener로
 * 등록한 리스너는 남아있으므로 clearInstanceListeners()도 필요하다.
 *
 * ## factory 의존성
 *
 * factory는 마운트 시 1회만 호출된다. 의존성 변경에 의한 재생성은 지원하지 않는다.
 * 재생성이 필요한 GroundOverlay 등은 React key prop으로 제어한다.
 */
export function useOverlayLifecycle<T>(
  factory: () => T,
  ref?: Ref<T>,
): T | null {
  const [instance, setInstance] = useState<T | null>(null);
  const instanceRef = useRef<T | null>(null);

  useLayoutEffect(() => {
    const inst = factory();
    instanceRef.current = inst;
    setInstance(inst);

    return () => {
      naver.maps?.Event?.clearInstanceListeners(inst);
      (inst as { setMap?: (map: null) => void }).setMap?.(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => instanceRef.current!);

  return instance;
}
