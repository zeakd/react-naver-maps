import { useState } from 'react';
import { kvoEquals } from './use-controlled-kvo.js';

/**
 * 값으로 같으면 지난 렌더의 참조를 돌려준다. 렌더마다 새로 만든 같은 값(인라인 `{ lat, lng }`,
 * `[url, bounds]`)을 effect deps 로 쓰면 effect 가 렌더마다 다시 돌기 때문이다. 비교는 kvoEquals.
 * 값이 바뀌면 그 렌더 안에서 새 값으로 바꾼다(렌더 중 상태 갱신, 이전 렌더 정보를 저장하는 React 패턴).
 */
export function useStableValue<T>(value: T): T {
  const [stable, setStable] = useState(value);
  if (!kvoEquals(stable, value)) {
    setStable(() => value);
    return value;
  }
  return stable;
}
