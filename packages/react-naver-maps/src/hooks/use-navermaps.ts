import { use } from 'react';
import type { LoadOptions } from '../load-script.js';
import { getClientParam, loadScript } from '../load-script.js';
import { ClientOptionsContext } from '../contexts/client-options.js';

const promiseCache = new Map<string, Promise<typeof naver.maps>>();

function cacheKey(options: LoadOptions): string {
  const [, paramValue] = getClientParam(options);
  const sub = options.submodules?.toSorted().join(',') ?? '';
  return `${paramValue}:${sub}`;
}

function getOrCreatePromise(options: LoadOptions): Promise<typeof naver.maps> {
  const key = cacheKey(options);
  const existing = promiseCache.get(key);
  if (existing) return existing;

  const promise = loadScript(options);
  promiseCache.set(key, promise);
  return promise;
}

/** naver.maps 네임스페이스를 반환한다. NavermapsProvider 내부에서 사용. */
export function useNavermaps(): typeof naver.maps {
  const options = use(ClientOptionsContext);
  if (!options) {
    throw new Error('useNavermaps must be used within <NavermapsProvider>');
  }
  return use(getOrCreatePromise(options));
}

/** 네이버맵 스크립트를 미리 로드한다. Provider 외부에서도 호출 가능. */
export function preloadNavermaps(options: LoadOptions): void {
  getOrCreatePromise(options);
}
