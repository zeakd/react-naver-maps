import { loadScript } from './utils/load-script';
import { getNavermaps } from './utils/get-navermaps';

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

export function loadNavermaps(options: Options) {
  const url = makeUrl(options);

  // TODO: Caching Promise

  const promise = loadScript(url).then(() => {
    const navermaps = getNavermaps();

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
