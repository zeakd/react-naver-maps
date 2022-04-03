import React, { isValidElement, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useMapDiv } from './contexts/map-div';
import { NaverMapContext } from './contexts/naver-map';
import { HandleEvents } from './helpers/event';
import { useNavermaps } from './hooks/useNavermaps';

type Props = {
  element?: HTMLDivElement;
  /** description! */
  center?: naver.maps.Point;
  children?: React.ReactNode;
};

export function NaverMap(props: Props) {
  const { children, center } = props;
  const navermaps = useNavermaps();
  const mapDiv = useMapDiv();
  const nmapRef = useRef<naver.maps.Map>();

  // https://github.com/facebook/react/issues/20090
  useLayoutEffect(() => {
    if (!mapDiv) {
      throw new Error('react-naver-maps: MapDiv is not found. Did you correctly wrap with `MapDiv`?');
    }

    const nmap = new navermaps.Map(mapDiv);
    nmapRef.current = nmap;

    return () => {
      nmap.destroy();
    };
  }, []);

  useEffect(() => {
    if (!nmapRef.current) {
      return;
    }

    const nmap = nmapRef.current;
    if (center) {
      nmap.setCenter(center);
    }
  }, [center]);

  return (
    <NaverMapContext.Provider value={nmapRef.current}>
      {children}
    </NaverMapContext.Provider>
  );

}
