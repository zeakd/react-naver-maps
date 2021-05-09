import { createContext, useContext } from 'react';

export const MapContext = createContext<naver.maps.Map | undefined>(undefined);
export const useMap: () => naver.maps.Map | undefined = () => useContext(MapContext);
