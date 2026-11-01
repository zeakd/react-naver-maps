import { use } from 'react';
import type { LoadOptions } from '../load-script.js';
import { loadScript } from '../load-script.js';
import { ClientOptionsContext } from '../contexts/client-options.js';

/**
 * naver.maps 네임스페이스를 반환한다. NavermapsProvider 내부에서 사용.
 *
 * 같은 옵션이면 loadScript 의 캐시가 같은 Promise 를 돌려주므로 use() 가 안정적으로
 * 동작한다. 로드에 실패하면 loadScript 가 캐시를 비우므로 다음 렌더에서 다시 시도한다.
 */
export function useNavermaps(): typeof naver.maps {
  const options = use(ClientOptionsContext);
  if (!options) {
    throw new Error('useNavermaps must be used within <NavermapsProvider>');
  }
  return use(loadScript(options));
}

/** 네이버맵 스크립트를 미리 로드한다. Provider 외부에서도 호출 가능. */
export function preloadNavermaps(options: LoadOptions): void {
  void loadScript(options).catch(() => {
    // preload 실패는 무시한다. 실제 사용 시점의 useNavermaps 가 다시 시도하고 에러를 드러낸다.
  });
}
