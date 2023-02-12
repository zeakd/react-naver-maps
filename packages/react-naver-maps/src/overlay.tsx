import { useEffect } from 'react';
import type { ReactNode } from 'react';

import { EventTargetContext } from './contexts/event-target';
import { useMap } from './contexts/naver-map';

type MapElementType = {
  setMap(map: naver.maps.Map | null): void;
  getMap(): naver.maps.Map | null;
};

export type Props = {
  element: MapElementType;
  children?: ReactNode;
  autoMount?: boolean;
};

export function Overlay(props: Props) {
  const { element, children, autoMount = true } = props;
  const nmap = useMap();

  useEffect(() => {
    if (!autoMount) {
      return;
    }

    if (element.getMap() === nmap) {
      return;
    }

    element.setMap(nmap ? nmap : null);
    return () => {
      element.setMap(null);
    };
  }, [nmap]);

  return (
    <EventTargetContext.Provider value={element}>
      {children}
    </EventTargetContext.Provider>
  );
}
