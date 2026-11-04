import { useInsertionEffect, useRef } from 'react';

/**
 * 커밋된 렌더의 값을 담는 ref. SDK 리스너처럼 오래 붙어 있는 콜백이 최신 핸들러를 부르게 한다.
 * 리스너를 핸들러마다 다시 붙이지 않으려는 것이다. 인라인 `onClick={() => …}` 은 렌더마다 새 함수라,
 * 그때마다 떼었다 붙이면 controlled center 로 끄는 동안 Marker 300개가 프레임마다 리스너 300개를 다시
 * 붙였다(e2e "Marker 300개와 controlled center 로 끌어도", 2026-11-05 실측).
 *
 * 렌더 중이 아니라 insertion effect 에서 쓴다. 렌더 중에 쓰면 React 가 버린 렌더(transition 중단 등)의
 * 값이 남는다. insertion effect 는 layout·passive effect 와 그 뒤의 이벤트보다 먼저 돈다.
 */
export function useLatest<T>(value: T): { readonly current: T } {
  const ref = useRef(value);
  useInsertionEffect(() => {
    ref.current = value;
  });
  return ref;
}
