import { createContext } from 'react';
import type { LoadOptions } from '../load-script.js';

export const ClientOptionsContext = createContext<LoadOptions | null>(null);
