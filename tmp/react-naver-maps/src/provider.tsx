import type { ReactNode } from 'react';

import { ClientOptionsContext } from './contexts/client-options';
import type { ClientOptions } from './types/client';

export type Props = ClientOptions & { children?: ReactNode };

export function NavermapsProvider({
  children,
  ...clientOptions
}: Props) {
  return (
    <ClientOptionsContext.Provider value={clientOptions}>
      {children}
    </ClientOptionsContext.Provider>
  );
}
