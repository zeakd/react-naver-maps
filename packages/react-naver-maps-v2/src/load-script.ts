export interface LoadOptions {
  ncpKeyId: string;
  submodules?: string[];
}

const cache = new Map<string, Promise<typeof naver.maps>>();

function buildUrl(options: LoadOptions): string {
  const params = new URLSearchParams({
    ncpClientId: options.ncpKeyId,
  });
  if (options.submodules?.length) {
    params.set('submodules', options.submodules.join(','));
  }
  return `https://oapi.map.naver.com/openapi/v3/maps.js?${params.toString()}`;
}

function cacheKey(options: LoadOptions): string {
  const sub = options.submodules?.toSorted().join(',') ?? '';
  return `${options.ncpKeyId}:${sub}`;
}

export function loadScript(options: LoadOptions): Promise<typeof naver.maps> {
  const key = cacheKey(options);
  const existing = cache.get(key);
  if (existing) return existing;

  const promise = new Promise<typeof naver.maps>((resolve, reject) => {
    if (typeof naver !== 'undefined' && naver.maps) {
      resolve(naver.maps);
      return;
    }

    const script = document.createElement('script');
    script.src = buildUrl(options);
    script.async = true;
    script.addEventListener('load', () => {
      if (typeof naver !== 'undefined' && naver.maps) {
        resolve(naver.maps);
      } else {
        reject(new Error('naver.maps not available after script load'));
      }
    });
    script.addEventListener('error', () => {
      cache.delete(key);
      reject(new Error('Failed to load naver maps script'));
    });
    document.head.appendChild(script);
  });

  cache.set(key, promise);
  return promise;
}
