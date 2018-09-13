import loadJs from 'load-js';

const loadNavermapsScript = ({ submodules = [], clientId } = {}) =>
  loadJs(
    `https://openapi.map.naver.com/openapi/v3/maps.js?clientId=${clientId}&submodules=${submodules.join(
      ',',
    )}`,
  ).then(() => {
    const navermaps = window.naver.maps;

    return new Promise(resolve => {
      navermaps.onJSContentLoaded = () => {
        resolve(navermaps);
      };
    });
  });

export default loadNavermapsScript;
