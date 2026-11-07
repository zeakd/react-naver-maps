/**
 * 네이버맵 스크립트 로딩 옵션.
 *
 * `ncpKeyId`는 NCP 콘솔 Maps > Application 에서 발급한 Client ID 다.
 * AI NAVER API 의 지도 API 가 2026-11-24 에 종료되어 그쪽 키 파라미터
 * (`ncpClientId`, `govClientId`, `finClientId`)는 0.3.0 에서 제거했다.
 * https://github.com/zeakd/react-naver-maps/issues/174
 */
export type LoadOptions = {
  ncpKeyId: string;
  /** SDK 서브모듈. 공식 문서 "서브 모듈 시스템" 의 이름이다. */
  submodules?: Submodule[];
  /**
   * 지도 언어(스크립트 URL 의 `language`). SDK 는 ko, en, zh, ja 를 받는다(공식 문서 "언어 설정하기").
   * 한 페이지에서 SDK 는 한 번만 불러오므로 처음 불러온 언어를 쓴다.
   */
  language?: Language;
};

export type Submodule =
  | 'panorama'
  | 'geocoder'
  | 'drawing'
  | 'visualization'
  | 'gl';
export type Language = 'ko' | 'en' | 'zh' | 'ja';

const REMOVED_KEY_OPTIONS = ['ncpClientId', 'govClientId', 'finClientId'];

const cache = new Map<string, Promise<typeof naver.maps>>();

/** @internal exported for tests */
export function getKeyId(options: LoadOptions): string {
  if (options.ncpKeyId) return options.ncpKeyId;
  const removed = REMOVED_KEY_OPTIONS.find((name) => name in options);
  if (removed) {
    throw new Error(
      `react-naver-maps: ${removed} 는 0.3.0 에서 제거되었습니다. NCP 콘솔 Maps 에서 발급한 키를 ncpKeyId 로 전달하세요. https://github.com/zeakd/react-naver-maps/issues/174`,
    );
  }
  throw new Error('react-naver-maps: ncpKeyId 가 필요합니다');
}

/** @internal exported for tests */
export function buildUrl(options: LoadOptions): string {
  const params = new URLSearchParams({ ncpKeyId: getKeyId(options) });
  let url = `https://oapi.map.naver.com/openapi/v3/maps.js?${params.toString()}`;
  if (options.submodules?.length) {
    // Naver Maps 로더는 submodules 쿼리 값을 raw `,` 로 split 해서
    // 각 `maps-{name}.js` 청크를 로드합니다. URLSearchParams 가 `,` 를
    // `%2C` 로 percent-encode 하면 로더가 전체 문자열을 하나의 submodule
    // 이름으로 취급해 `maps-{joined}%2C{...}.js` 에 요청 → 404 발생.
    url += `&submodules=${options.submodules.join(',')}`;
  }
  if (options.language) url += `&language=${options.language}`;
  return url;
}

function cacheKey(options: LoadOptions): string {
  const sub = options.submodules?.toSorted().join(',') ?? '';
  return `${getKeyId(options)}:${sub}:${options.language ?? ''}`;
}

// 인증 실패. SDK 는 실패하면 그때의 전역 window.navermap_authFailure 를 부른다(3.10.5 확인).
// 전역 하나를 여러 구독자가 나눠 쓰게 한 번만 감싸고, 페이지가 먼저 둔 함수도 부른다.
const authFailureHandlers = new Set<() => void>();
let authFailed = false;
let authHookInstalled = false;

function installAuthFailureHook() {
  if (authHookInstalled || typeof window === 'undefined') return;
  authHookInstalled = true;
  const w = window as unknown as { navermap_authFailure?: () => void };
  const prev = w.navermap_authFailure;
  w.navermap_authFailure = () => {
    authFailed = true;
    try {
      prev?.();
    } finally {
      for (const handler of authFailureHandlers) handler();
    }
  };
}

/**
 * 인증 실패를 구독한다. 이미 실패했으면 곧바로 한 번 부른다. 해제 함수를 돌려준다.
 * NavermapsProvider 의 `onAuthFailure` 가 쓴다.
 */
export function subscribeAuthFailure(handler: () => void): () => void {
  installAuthFailureHook();
  authFailureHandlers.add(handler);
  if (authFailed) handler();
  return () => {
    authFailureHandlers.delete(handler);
  };
}

/** @internal exported for tests */
export function waitForJsContentLoaded(
  maps: typeof naver.maps,
): Promise<typeof naver.maps> {
  if (maps.jsContentLoaded) return Promise.resolve(maps);
  return new Promise((resolve) => {
    const prev = maps.onJSContentLoaded;
    maps.onJSContentLoaded = () => {
      if (typeof prev === 'function') {
        try {
          prev();
        } catch {
          // chained handler 의 에러가 submodule resolution 을 막지 않도록 swallow
        }
      }
      resolve(maps);
    };
  });
}

// 페이지가 먼저 넣은 SDK 의 서브모듈이 붙을 때까지 기다리는 최대 시간.
const PRELOADED_SDK_GRACE_MS = 1000;

/**
 * 이 함수가 불리기 전에 이미 페이지에 있던 SDK 를 기다린다.
 *
 * SDK 는 window load 시점에 onJSContentLoaded 가 등록돼 있어야만 jsContentLoaded 를 켜고
 * 콜백을 부른다. 페이지가 maps.js 를 직접 넣었고 load 가 이미 지났다면 콜백이 다시 오지 않을 수
 * 있다. 서브모듈이 아직 붙는 중일 수도 있어 콜백을 먼저 기다리고, 오지 않으면 유예 뒤 끝낸다.
 *
 * @internal exported for tests
 */
export function waitForExistingSdk(
  maps: typeof naver.maps,
): Promise<typeof naver.maps> {
  return new Promise((resolve) => {
    waitForJsContentLoaded(maps).then(resolve);
    if (document.readyState === 'complete') {
      setTimeout(() => resolve(maps), PRELOADED_SDK_GRACE_MS);
    }
  });
}

/**
 * 페이지에 넣은 SDK 스크립트. 페이지에 SDK 는 하나뿐이고 URL 을 바꿔 다시 넣을 수 없으므로 로딩 중인
 * 스크립트는 하나만 둔다. 다른 옵션의 요청도 여기에 합류해 처음 요청의 언어와 서브모듈을 쓴다(로드가 끝난
 * 뒤 다른 옵션으로 부른 것과 같다). 없는 서브모듈은 쓸 때 requireSubmodule 이 알려 준다.
 */
let inFlight: Promise<typeof naver.maps> | null = null;

function insertScript(options: LoadOptions): Promise<typeof naver.maps> {
  if (inFlight) return inFlight;
  const loading = new Promise<typeof naver.maps>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = buildUrl(options);
    script.async = true;
    script.addEventListener('load', () => {
      if (typeof naver !== 'undefined' && naver.maps) {
        waitForJsContentLoaded(naver.maps).then(resolve);
      } else {
        reject(new Error('naver.maps not available after script load'));
      }
    });
    script.addEventListener('error', () => {
      reject(new Error('Failed to load naver maps script'));
    });
    document.head.appendChild(script);
  });
  inFlight = loading;
  const settled = () => {
    inFlight = null;
  };
  loading.then(settled, settled);
  return loading;
}

export function loadScript(options: LoadOptions): Promise<typeof naver.maps> {
  if (typeof document === 'undefined') {
    return new Promise<typeof naver.maps>(() => {});
  }

  const key = cacheKey(options);
  const existing = cache.get(key);
  if (existing) return existing;

  installAuthFailureHook();
  // 로딩 중이면 전역이 이미 생겼어도(서브모듈을 기다리는 중) 그 스크립트가 끝나기를 기다린다.
  const loading =
    inFlight ??
    (typeof naver !== 'undefined' && naver.maps
      ? waitForExistingSdk(naver.maps)
      : insertScript(options));
  // 실패는 캐시에 남기지 않는다. 다음 렌더(useNavermaps)가 다시 시도한다.
  const promise = loading.catch((error: unknown) => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, promise);
  return promise;
}
