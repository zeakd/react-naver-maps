import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';

export default function useNaverMap(): [naver.maps.Map | undefined, React.MutableRefObject<HTMLDivElement>] {
  const [map, setMap] = useState<naver.maps.Map>();
  const ref = useRef() as React.MutableRefObject<HTMLDivElement>;

  useLayoutEffect(() => {
    if (ref.current) {
      setMap(new naver.maps.Map(ref.current));
    }

    // return () => {
    //   if (map) map.destroy();
    // };
  }, []);

  const result = useMemo<[naver.maps.Map | undefined, React.MutableRefObject<HTMLDivElement>]>(() => {
    return [map, ref];
  }, [map]);

  return result;
}
