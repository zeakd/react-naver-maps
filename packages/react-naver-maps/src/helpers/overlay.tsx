import React, { useEffect } from 'react';
import { useMap } from '../contexts/naver-map';
import { EventTargetContext } from '../contexts/event-target';

type MapElementType = {
  setMap(map: naver.maps.Map | null): void;
};

type Props = {
  element: MapElementType;
  children?: React.ReactNode;
  autoMount?: boolean;
};

export function Overlay(props: Props) {
  const { element, children, autoMount = true } = props;
  const nmap = useMap();

  useEffect(() => {
    if (autoMount) {
      element.setMap(nmap ? nmap : null);
    }
  }, [nmap]);

  return (
    <EventTargetContext.Provider value={element}>
      {children}
    </EventTargetContext.Provider>
  );
}
