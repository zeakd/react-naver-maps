import React, { useEffect } from 'react';
import { useMap } from '../contexts/naver-map';
import { EventTargetContext } from '../contexts/event-target';

type MapElementType = {
  setMap(map: naver.maps.Map | null): void;
};

type Props = {
  element: MapElementType;
  children?: React.ReactNode;
};

export function Overlay(props: Props) {
  const { element, children } = props;
  const nmap = useMap();

  useEffect(() => {
    element.setMap(nmap ? nmap : null);
  }, [nmap]);

  return (
    <EventTargetContext.Provider value={element}>
      {children}
    </EventTargetContext.Provider>
  );
}
