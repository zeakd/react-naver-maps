import { createContext, useContext } from 'react';

export const EventTargetContext = createContext<any | undefined>(undefined);
export const useEventTarget: () => any | undefined = () => useContext(EventTargetContext);
