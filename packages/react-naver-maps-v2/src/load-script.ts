/**
 * 네이버맵 인증 키 옵션.
 *
 * 네이버맵 API는 4종의 인증 키를 지원한다:
 * - ncpKeyId: 현재 표준 (NCP, /v3/auth 인증)
 * - ncpClientId: NCP 레거시 (/v1/validatev3 인증)
 * - govClientId: 공공기관용 레거시
 * - finClientId: 금융기관용 레거시
 *
 * 하나만 전달해야 하며, 여러 개 전달 시 마지막 것이 사용된다.
 */
export type LoadOptions = {
  submodules?: string[];
} & (
  | {
      ncpKeyId: string;
      ncpClientId?: never;
      govClientId?: never;
      finClientId?: never;
    }
  | {
      ncpKeyId?: never;
      ncpClientId: string;
      govClientId?: never;
      finClientId?: never;
    }
  | {
      ncpKeyId?: never;
      ncpClientId?: never;
      govClientId: string;
      finClientId?: never;
    }
  | {
      ncpKeyId?: never;
      ncpClientId?: never;
      govClientId?: never;
      finClientId: string;
    }
);

const cache = new Map<string, Promise<typeof naver.maps>>();

export function getClientParam(options: LoadOptions): [string, string] {
  if ('ncpKeyId' in options && options.ncpKeyId)
    return ['ncpKeyId', options.ncpKeyId];
  if ('ncpClientId' in options && options.ncpClientId)
    return ['ncpClientId', options.ncpClientId];
  if ('govClientId' in options && options.govClientId)
    return ['govClientId', options.govClientId];
  if ('finClientId' in options && options.finClientId)
    return ['finClientId', options.finClientId];
  throw new Error(
    'react-naver-maps: 인증 키가 필요합니다 (ncpKeyId, ncpClientId, govClientId, finClientId 중 하나)',
  );
}

function buildUrl(options: LoadOptions): string {
  const [paramName, paramValue] = getClientParam(options);
  const params = new URLSearchParams({ [paramName]: paramValue });
  if (options.submodules?.length) {
    params.set('submodules', options.submodules.join(','));
  }
  return `https://oapi.map.naver.com/openapi/v3/maps.js?${params.toString()}`;
}

function cacheKey(options: LoadOptions): string {
  const [, paramValue] = getClientParam(options);
  const sub = options.submodules?.toSorted().join(',') ?? '';
  return `${paramValue}:${sub}`;
}

export function loadScript(options: LoadOptions): Promise<typeof naver.maps> {
  if (typeof document === 'undefined') {
    throw new Error('loadScript must be called in browser environment');
  }

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
