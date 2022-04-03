import React, { useEffect, useState } from 'react';
import { loadScript } from './utils/load-script';

type NcpOptions = {
  submodules?: string[];
  ncpClientId: string;
};

type GovOptions = {
  submodules?: string[];
  govClientId: string;
};

type finOptions = {
  submodules?: string[];
  finClientId: string;
};

export type Options = NcpOptions | GovOptions | finOptions;

export function loadNavermapsScript(options: Options) {
  const url = makeUrl(options);

  // TODO: Caching Promise

  const promise = loadScript(url).then(() => {
    const navermaps = window.naver.maps;

    if (navermaps.jsContentLoaded) {
      return navermaps;
    }

    return new Promise<typeof naver.maps>(resolve => {
      navermaps.onJSContentLoaded = () => {
        resolve(navermaps);
      };
    });
  });

  return promise;
}

function makeUrl(options: Options) {
  const submodules = options.submodules;

  const clientIdQuery = 'ncpClientId' in options
    ? `ncpClientId=${options.ncpClientId}`
    : 'govClientId' in options
      ? `govClientId=${options.govClientId}`
      : 'finClientId' in options
        ? `finClientId=${options.finClientId}`
        : undefined;

  if (!clientIdQuery) {
    throw new Error('react-naver-maps: ncpClientId, govClientId or finClientId is required');
  }

  let url = `https://openapi.map.naver.com/openapi/v3/maps.js?${clientIdQuery}`;

  if (submodules) {
    url += `&submodules=${submodules.join(',')}`;
  }

  return url;
}

type Props = Options & {
  children: () => React.ReactElement;
};

export function LoadNavermapsScript({
  children: Children,
  ...options
}: Props) {
  const [navermaps, setNavermaps] = useState<typeof naver.maps>();

  useEffect(() => {
    loadNavermapsScript(options).then((maps) => {
      setNavermaps(maps);
    });
  }, []);

  return (
    (navermaps && Children) ? <Children /> : null
  );
}
