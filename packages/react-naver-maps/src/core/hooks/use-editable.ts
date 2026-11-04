import { useLayoutEffect, useRef } from 'react';
import { useNavermaps } from './use-navermaps.js';
import { requireSubmodule } from '../utils/submodule.js';

type Editable = {
  setEditable?: (editable: boolean) => void;
};

/**
 * 도형의 `editable`. drawing 서브모듈을 불러오면 SDK 도형에 `setEditable` 이 생긴다
 * (공식 문서 DrawingOverlay, 3.10.5 실측). 꼭짓점을 끌면 SDK 가 path 배열(KVOArray)을 제자리에서
 * 고치고 `set_at` 등을 낸다. `path_changed` 는 오지 않는다.
 *
 * 그래서 controlled `path`/`paths` 와 함께 쓰면 다음 렌더에 편집이 되돌려진다. `defaultPath` 로 두고
 * 결과는 ref 의 `getPath()` 로 읽는다.
 */
export function useEditable(
  shape: object,
  editable: boolean | undefined,
  usedBy: string,
): void {
  const navermaps = useNavermaps();
  if (editable) requireSubmodule(navermaps, 'drawing', `${usedBy} 의 editable`);
  const prev = useRef<boolean | undefined>(undefined);
  useLayoutEffect(() => {
    const last = prev.current;
    prev.current = editable;
    if (editable === undefined || last === editable) return;
    if (last === undefined && !editable) return;
    (shape as Editable).setEditable?.(editable);
  });
}
