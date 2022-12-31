import { createContext, useContext } from 'react';

import type { ClientOptions } from '../types/client';

export const ClientOptionsContext = createContext<ClientOptions>({} as ClientOptions);
export const useClientOptions = () => useContext(ClientOptionsContext);
