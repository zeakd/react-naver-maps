import React from 'react';
import { compose, wrapDisplayName, pure } from 'recompose';
import pick from '../utils/pick';

import { namedWrapper, withNavermaps, bridgeEventHandlers } from '../hocs';

const naverEventNames = [
  'click',
  'clickable_changed',
  'dblclick',
  'mousedown',
  'mouseout',
  'mouseover',
  'mouseup',
  'visible_changed',
  'zIndex_changed',

  'rightclick',
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

const pickPolygonOptions = pick([
  'map',
  'paths',
  'strokeWeight',
  'strokeOpacity',
  'strokeColor',
  'strokeStyle',
  'strokeLineCap',
  'strokeLineJoin',
  'fillColor',
  'fillOpacity',
  'clickable',
  'visible',
  'zIndex',
]);

class PolygonBase extends React.Component {
  componentWillUnmount() {
    if (this.polygon) this.polygon.setMap(null);
  }

  createPolygon() {
    const { navermaps, map } = this.props;

    this.instance = new navermaps.Polygon({
      map,
    });

    // alias
    this.polygon = this.instance;

    this.props.registerInstance(this.polygon);
    return this.polygon;
  }

  updatePolygon() {
    const polygonOptions = pickPolygonOptions(this.props);

    this.polygon.setOptions(polygonOptions);
  }

  render() {
    if (!this.polygon) {
      this.createPolygon();
    }

    this.updatePolygon();

    return null;
  }
}

const EnhancedPolygon = compose(
  namedWrapper('Polygon'),
  pure,
  withNavermaps,
  bridgeEventHandlers,
)(PolygonBase);

EnhancedPolygon.defaultProps = {
  events: naverEventNames,
};

export default EnhancedPolygon;
