import { createContext, useContext } from 'react';

export const MapDivContext = createContext<any | undefined>(undefined);
export const useMapDiv: () => any | undefined = () => useContext(MapDivContext);
