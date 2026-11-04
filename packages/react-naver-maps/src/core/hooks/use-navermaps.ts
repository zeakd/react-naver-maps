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
  // SDK 는 브라우저에서만 불러온다. 서버에서 끝나지 않는 Promise 로 suspend 하면 스트리밍 서버 렌더가
  // 그 Promise 를 끝없이 기다렸다(Container 밖에서 부른 예제가 Astro 서버 렌더를 멈춤, 2026-11-04).
  // React 가 정한 방법대로 서버에서는 던진다. 가장 가까운 Suspense 경계가 fallback 을 서버 HTML 에 넣고
  // 클라이언트에서 다시 렌더한다(react.dev/reference/react/Suspense "Providing a fallback for server
  // errors and client-only content"). 경계가 없으면 서버 렌더가 이 메시지로 실패한다.
  // 라이브러리 컴포넌트는 Container 가 브라우저에서만 자식을 그려 서버에서 여기 오지 않는다.
  if (typeof document === 'undefined') {
    throw new Error(
      '[react-naver-maps] useNavermaps() 는 브라우저에서만 SDK 를 돌려준다. 서버 렌더에서는 <Container> 안이나 <Suspense> 경계 안에서 부른다(경계가 그 부분을 클라이언트에서 렌더한다).',
    );
  }
  return use(loadScript(options));
}

/** 네이버맵 스크립트를 미리 로드한다. Provider 외부에서도 호출 가능. */
export function preloadNavermaps(options: LoadOptions): void {
  void loadScript(options).catch(() => {
    // preload 실패는 무시한다. 실제 사용 시점의 useNavermaps 가 다시 시도하고 에러를 드러낸다.
  });
}
