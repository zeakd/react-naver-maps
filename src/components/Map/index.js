import { compose } from 'recompose';
import NaverMapDom from './NaverMapDom';
import withNaverMapInstance from './withNaverMapInstance';

import {
  withNavermaps,
  namedWrapper,
  bridgeEventHandlers,
  injectNaverRef,
} from '../../hocs';

const NaverMap = compose(
  // withForwardedRef,
  namedWrapper('NaverMap'),
  withNavermaps,
  // updateFixer,
  bridgeEventHandlers,
  injectNaverRef,
  withNaverMapInstance,
)(NaverMapDom);

NaverMap.defaultProps = {
  events: [
    'addLayer',
    'click',
    'dblclick',
    'doubletap',
    'drag',
    'dragend',
    'dragstart',
    'idle',
    'keydown',
    'keyup',
    'longtap',
    'mousedown',
    'mousemove',
    'mouseout',
    'mouseover',
    'mouseup',
    'panning',
    'pinch',
    'pinchend',
    'pinchstart',
    'removeLayer',
    'resize',
    'rightclick',
    'tap',
    'tilesloaded',
    'touchend',
    'touchmove',
    'touchstart',
    'twofingertap',
    'zooming',
    'mapType_changed',
    'mapTypeId_changed',
    'size_changed',
    'bounds_changed',
    'center_changed',
    'centerPoint_changed',
    'projection_changed',
    'zoom_changed',
  ],
  mapDivId: 'react-naver-map',
  style: {
    width: '100%',
    height: '100%',
  },
};

export default NaverMap;
