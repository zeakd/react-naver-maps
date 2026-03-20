'use client';

import type { ReactNode } from 'react';
import { preconnect } from 'react-dom';
import type { LoadOptions } from './load-script.js';
import { ClientOptionsContext } from './contexts/client-options.js';

/** 네이버맵 스크립트 로딩을 위한 Provider. 앱 루트에 배치한다. */
export type NavermapsProviderProps = LoadOptions & {
  children: ReactNode;
};

export function NavermapsProvider({
  children,
  ...options
}: NavermapsProviderProps) {
  preconnect('https://oapi.map.naver.com');
  return (
    <ClientOptionsContext value={options}>{children}</ClientOptionsContext>
  );
}
