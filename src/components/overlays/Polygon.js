/**
 * npm modules
 */
import React from 'react';
import PropTypes from 'prop-types';

/**
 * local moduleds
 */
import Overlay from '../Overlay';
import pick from '../../utils/pick';
import { withNavermaps } from '../../hocs';

const pickPolygonOptions = pick([
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

/**
 *
 * @param {*} props
 */
function Polygon(props) {
  return (
    <Overlay
      {...props}
      OverlayView={props.navermaps.Polygon}
      pickOverlayOptions={pickPolygonOptions}
    />
  );
}

Polygon.defaultProps = {
  events: [
    'click',
    'clickable_changed',
    'dblclick',
    'mousedown',
    'mouseout',
    'mouseover',
    'mouseup',
    'visible_changed',
    'zIndex_changed',
  ],
  strokeWeight: 1,
  strokeOpacity: 1,
  strokeColor: '#007EEA',
  strokeStyle: 'solid',
  strokeLineCap: 'butt',
  strokeLineJoin: 'miter',
  fillColor: 'none',
  fillOpacity: 1,
  clickable: false,
  visible: true,
  zIndex: 0,
};

Polygon.propTypes = {
  navermaps: PropTypes.object,
  events: PropTypes.arrayOf(PropTypes.string),
  paths: PropTypes.any.isRequired,
  strokeWeight: PropTypes.number,
  strokeOpacity: PropTypes.number,
  strokeColor: PropTypes.string,
  strokeStyle: PropTypes.string,
  strokeLineCap: PropTypes.string,
  strokeLineJoin: PropTypes.string,
  fillColor: PropTypes.string,
  fillOpacity: PropTypes.number,
  clickable: PropTypes.bool,
  visible: PropTypes.bool,
  zIndex: PropTypes.number,
};

export default withNavermaps(Polygon);
