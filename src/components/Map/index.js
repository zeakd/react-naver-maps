import React from 'react'
import PropTypes from 'prop-types'
import { compose } from 'recompose';
import withNaverMapInstance from './withNaverMapInstance';

import {
  withNavermaps,
  namedWrapper,
  bridgeEventHandlers,
  injectNaverRef,
} from '../../hocs';

function NaverMapDom({ mapDivId, style, className, children }) {
  return (
    <div id={mapDivId} className={className} style={style}>
      {children}
    </div>
  );
}

/**
 *  @visibleName NaverMap
 */
const ComposedMap = compose(
  withNavermaps,
  // updateFixer,
  bridgeEventHandlers,
  injectNaverRef,
  withNaverMapInstance,
)(NaverMapDom);


/**
 * Facade for Map
 * @param {*} props 
 */
function NaverMap(props) {
  return <ComposedMap {...props} />
}

NaverMap.propTypes = {
  mapDivId: PropTypes.string,
  events:  PropTypes.arrayOf(PropTypes.string),
  style: PropTypes.object,
}

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
