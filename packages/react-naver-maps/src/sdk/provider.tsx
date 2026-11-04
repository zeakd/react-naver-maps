'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { preconnect } from 'react-dom';
import type { LoadOptions } from './load-script.js';
import { subscribeAuthFailure } from './load-script.js';
import { ClientOptionsContext } from './client-options-context.js';

/** 네이버맵 스크립트 로딩을 위한 Provider. 앱 루트에 배치한다. */
export type NavermapsProviderProps = LoadOptions & {
  children: ReactNode;
  /**
   * 인증에 실패했을 때(키가 틀림, Web 서비스 URL 미등록, Dynamic Map 미선택 등). SDK 의 전역
   * `navermap_authFailure` 를 받는다. 실패하면 SDK 는 지도를 그리지 않고 곧 `naver.maps` 를 비운다.
   * 페이지가 먼저 둔 `window.navermap_authFailure` 도 그대로 불린다.
   */
  onAuthFailure?: () => void;
};

export function NavermapsProvider({
  children,
  onAuthFailure,
  ...options
}: NavermapsProviderProps) {
  preconnect('https://oapi.map.naver.com');
  // 핸들러가 렌더마다 새 함수여도 다시 구독하지 않는다. 피어 범위(React 19.0)에 useEffectEvent 가 없다.
  const authFailureRef = useRef(onAuthFailure);
  useEffect(() => {
    authFailureRef.current = onAuthFailure;
  });
  const hasHandler = onAuthFailure !== undefined;
  useEffect(() => {
    if (!hasHandler) return;
    return subscribeAuthFailure(() => authFailureRef.current?.());
  }, [hasHandler]);
  return (
    <ClientOptionsContext value={options}>{children}</ClientOptionsContext>
  );
}
