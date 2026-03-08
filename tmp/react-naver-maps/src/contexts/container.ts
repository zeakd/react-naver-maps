import { createContext, useContext } from 'react';

export type ContainerContextType = { element: HTMLElement | null };

export const ContainerContext = createContext<ContainerContextType>({ element: null });
export const useContainerContext = () => useContext(ContainerContext);
