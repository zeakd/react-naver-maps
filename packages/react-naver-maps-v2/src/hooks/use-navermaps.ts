import { use } from 'react';
import type { LoadOptions } from '../load-script.js';
import { loadScript } from '../load-script.js';
import { ClientOptionsContext } from '../contexts/client-options.js';

const promiseCache = new Map<string, Promise<typeof naver.maps>>();

function cacheKey(options: LoadOptions): string {
  const sub = options.submodules?.toSorted().join(',') ?? '';
  return `${options.ncpKeyId}:${sub}`;
}

function getOrCreatePromise(options: LoadOptions): Promise<typeof naver.maps> {
  const key = cacheKey(options);
  const existing = promiseCache.get(key);
  if (existing) return existing;

  const promise = loadScript(options);
  promiseCache.set(key, promise);
  return promise;
}

export function useNavermaps(): typeof naver.maps {
  const options = use(ClientOptionsContext);
  if (!options) {
    throw new Error('useNavermaps must be used within <NavermapsProvider>');
  }
  return use(getOrCreatePromise(options));
}

export function preloadNavermaps(options: LoadOptions): void {
  getOrCreatePromise(options);
}
