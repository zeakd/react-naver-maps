import React from 'react';
import { compose, wrapDisplayName, pure } from 'recompose';
import pick from '../utils/pick';

import { namedWrapper, withNavermaps, bridgeEventHandlers } from '../hocs';

const naverEventNames = [
  'clickable_changed',
  'cursor_changed',
  'draggable_changed',
  'icon_changed',
  'position_changed',
  'shape_changed',
  'title_changed',
  'visible_changed',
  'zIndex_changed',

  'mousedown',
  'mouseup',
  'click',
  'dblclick',
  'rightclick',
  'mouseover',
  'mouseout',
  'mousemove',
  'dragstart',
  'drag',
  'dragend',
  'touchstart',
  'touchmove',
  'touchend',
  'pinchstart',
  'pinch',
  'pinchend',
  'tap',
  'longtap',
  'twofingertap',
  'doubletap',
];

const pickMarkerOptions = pick([
  'map',
  'position',
  'animation',
  'icon',
  'shape',
  'title',
  'cursor',
  'clickable',
  'draggable',
  'visible',
  'zIndex',
]);

class MarkerBase extends React.Component {
  componentWillUnmount() {
    // console.log('unmount');
    if (this.marker) this.marker.setMap(null);
  }

  createMarker() {
    const { navermaps, map } = this.props;

    this.instance = new navermaps.Marker({
      map,
    });

    // alias
    this.marker = this.instance;

    this.props.registerInstance(this.marker);
    return this.marker;
  }

  updateMarker() {
    const markerOptions = pickMarkerOptions(this.props);

    this.marker.setOptions(markerOptions);
  }

  render() {
    if (!this.marker) {
      this.createMarker();
    }

    this.updateMarker();

    return null;
  }
}

const EnhancedMarker = compose(
  namedWrapper('Marker'),
  pure,
  withNavermaps,
  bridgeEventHandlers,
)(MarkerBase);

EnhancedMarker.defaultProps = {
  events: naverEventNames,
};

export default EnhancedMarker;
