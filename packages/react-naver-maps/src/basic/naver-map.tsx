import React, { isValidElement, useLayoutEffect, useRef, useState } from 'react';
import { MapContext } from '../contexts/map-context';
import { getNavermaps } from '../utils/get-navermaps';

type Props = {
  children?: React.ReactNode;
  container?: React.ReactElement;
};

export function NaverMap(props: Props): React.ReactNode {
  const ref = useRef(null);
  const navermaps = getNavermaps();
  const mapRef = useRef<naver.maps.Map>();
  const [map, setMap] = useState<naver.maps.Map>();

  useLayoutEffect(() => {
    if (!ref.current) {
      throw new Error('react-naver-maps: Dom of NaverMap is not exist. Is container correctly forward ref?');
    }

    mapRef.current = new navermaps.Map(ref.current);
    setMap(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.destroy();
      }
    };
  }, []);

  if (props.container && !isValidElement<any>(props.container)) {
    throw new Error('react-naver-maps: "props.container" should be Element.');
  }

  return (
    <>
      {props.container
        ? React.cloneElement(props.container, { ref })
        : <div ref={ref} style={{ width: '100%', height: '100%' }} />
      }
      <MapContext.Provider value={map}>
        {props.children}
      </MapContext.Provider>
    </>
  );
}
