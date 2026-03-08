'use client';

import type { ReactNode } from 'react';
import { preconnect } from 'react-dom';
import type { LoadOptions } from './load-script.js';
import { ClientOptionsContext } from './contexts/client-options.js';

export interface NavermapsProviderProps extends LoadOptions {
  children: ReactNode;
}

export function NavermapsProvider({
  children,
  ...options
}: NavermapsProviderProps) {
  preconnect('https://oapi.map.naver.com');
  return (
    <ClientOptionsContext value={options}>{children}</ClientOptionsContext>
  );
}
