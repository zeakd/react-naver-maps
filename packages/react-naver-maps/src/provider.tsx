import React from 'react';
import type { ReactNode } from 'react';
import { ClientOptionsContext } from './contexts/client-options';
import type { ClientOptions } from './types/client';

type Props = ClientOptions & { children?: ReactNode };

export function NaverMapsProvider({
  children,
  ...clientOptions
}: Props) {
  return (
    <ClientOptionsContext.Provider value={clientOptions}>
      {children}
    </ClientOptionsContext.Provider>
  );
}
