import loadJs from 'load-js';
import invariant from 'invariant';

const _loadNavermapsScript = ({ clientId, submodules, ncpClientId }) => {
  invariant(clientId || ncpClientId, 'clientId or ncpClientId is required');

  // build naver maps v3 api url
  let requestUrl = `https://openapi.map.naver.com/openapi/v3/maps.js`;
  requestUrl += `?ncpClientId=${clientId || ncpClientId}`;

  if (submodules) {
    requestUrl += `&submodules=${submodules.join(',')}`;
  }

  return loadJs(requestUrl).then(() => {
    const navermaps = window.naver.maps;

    if (navermaps.jsContentLoaded) {
      return navermaps;
    }

    const loadingJsContent = new Promise(resolve => {
      navermaps.onJSContentLoaded = () => {
        resolve(navermaps);
      };
    });

    return loadingJsContent;
  });
};

let loadScriptPromise = null;

const loadNavermapsScript = ({ clientId, submodules, ncpClientId }) => {
  invariant(
    clientId || ncpClientId,
    'loadNavermapsScript: clientId or ncpClientId is required',
  );

  if (loadScriptPromise) {
    return loadScriptPromise;
  }

  loadScriptPromise = _loadNavermapsScript({
    clientId,
    ncpClientId,
    submodules,
  });

  return loadScriptPromise;
};
export default loadNavermapsScript;
