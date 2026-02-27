import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';

import type { ClientOptions } from './types/client';
import { loadScript } from './utils/load-script';

const cachedPromises = new Map<string, Promise<typeof naver.maps>>();

export function loadNavermapsScript(options: ClientOptions) {
  const url = makeUrl(options);

  const cached = cachedPromises.get(url);
  if (cached) {
    return cached;
  }

  const promise = loadScript(url)
    .then(() => {
      const navermaps = window.naver?.maps;

      if (!navermaps) {
        throw new Error('react-naver-maps: Failed to load Naver Maps script. '
          + 'window.naver.maps is not available. '
          + 'Please check your client ID and network connection.');
      }

      if (navermaps.jsContentLoaded) {
        return navermaps;
      }

      return new Promise<typeof naver.maps>(resolve => {
        navermaps.onJSContentLoaded = () => {
          resolve(navermaps);
        };
      });
    })
    .catch((err) => {
      cachedPromises.delete(url);
      throw err;
    });

  cachedPromises.set(url, promise);

  return promise;
}

function makeUrl(options: ClientOptions) {
  const submodules = options.submodules;

  const clientIdQuery = 'ncpKeyId' in options ? `ncpKeyId=${options.ncpKeyId}` :
    'ncpClientId' in options
      ? `ncpClientId=${options.ncpClientId}`
      : 'govClientId' in options
        ? `govClientId=${options.govClientId}`
        : 'finClientId' in options
          ? `finClientId=${options.finClientId}`
          : undefined;

  if (!clientIdQuery) {
    throw new Error('react-naver-maps: ncpKeyId, ncpClientId, govClientId or finClientId is required');
  }

  let url = `https://oapi.map.naver.com/openapi/v3/maps.js?${clientIdQuery}`;

  if (submodules) {
    url += `&submodules=${submodules.join(',')}`;
  }

  return url;
}


type Props = ClientOptions & {
  children: () => ReactElement;
};

export function LoadNavermapsScript({
  children: Children,
  ...options
}: Props) {
  const [navermaps, setNavermaps] = useState<typeof naver.maps>();

  useEffect(() => {
    loadNavermapsScript(options)
      .then((maps) => {
        setNavermaps(maps);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  return (
    (navermaps && Children) ? <Children /> : null
  );
}
