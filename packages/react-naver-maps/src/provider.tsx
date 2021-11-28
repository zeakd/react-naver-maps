import React, { useEffect, useState } from 'react';
import { loadNavermaps, Options } from './load-navermaps';

type Props = Options & {
  children: () => React.ReactElement;
};

export function Provider({
  children,
  ...options
}: Props) {
  const [navermaps, setNavermaps] = useState<typeof naver.maps>();

  useEffect(() => {
    loadNavermaps(options).then((maps) => {
      setNavermaps(maps);
    });
  }, []);

  return (
    (navermaps && children) ? children() : null
  );
}
