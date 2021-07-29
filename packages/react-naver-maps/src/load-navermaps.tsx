import React, { useEffect, useState } from 'react';
import loadScript from './utils/load-script';
import getNavermaps from './utils/get-navermaps';

type Props = {
  ncpClientId: string;
  render: () => React.ReactElement;
};

const LoadNavermaps: React.FC<Props> = ({
  ncpClientId,
  render: Comp,
}) => {
  const [navermaps, setNavermaps] = useState<typeof naver.maps>();
  useEffect(() => {
    loadScript(`https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${ncpClientId}`).then(() => {
      setNavermaps(getNavermaps());
    });
  }, []);

  return (
    (navermaps && Comp) ? <Comp /> : null
  );
};

export default LoadNavermaps;
