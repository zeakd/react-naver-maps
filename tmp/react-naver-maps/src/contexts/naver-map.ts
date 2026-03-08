import { createContext, useContext } from 'react';

export const NaverMapContext = createContext<naver.maps.Map | undefined>(undefined);
export const useMap: () => naver.maps.Map | undefined = () => useContext(NaverMapContext);
