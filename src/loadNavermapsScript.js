import loadJs from 'load-js'
import hasSubmodule from './hasSubmodule'

const loadNavermapsScript = ({ submodules = [], clientId } = {}) => loadJs(
  `https://openapi.map.naver.com/openapi/v3/maps.js?clientId=${clientId}&submodules=${submodules.join(',')}`
).then(() => {
  const navermaps = window.naver.maps;

  // check submodule is already loaded.
  const allSubmoduleLoaded = submodules.reduce(
    (p, submodule) => hasSubmodule(navermaps, submodule) && p,
    true
  );

  if (allSubmoduleLoaded) {  
    return navermaps;
    
  } else {
    return new Promise(resolve => {
      navermaps.onJSContentLoaded = () => {
        resolve(navermaps)
      };
    });
  }
})

export default loadNavermapsScript