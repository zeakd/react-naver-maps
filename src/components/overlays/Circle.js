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

const pickCircleOptions = pick([
  'center',
  'radius',
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
function Circle(props) {
  return (
    <Overlay
      {...props}
      OverlayView={props.navermaps.Circle}
      pickOverlayOptions={pickCircleOptions}
    />
  );
}

Circle.defaultProps = {
  events: [
    'center_changed',
    'click',
    'clickable_changed',
    'dblclick',
    'mousedown',
    'mouseout',
    'mouseover',
    'mouseup',
    'radius_changed',
    'visible_changed',
    'zIndex_changed',
  ],
  radius: 0,
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

Circle.propTypes = {
  navermaps: PropTypes.object,
  events: PropTypes.arrayOf(PropTypes.string),
  center: PropTypes.object.isRequired,
  radius: PropTypes.number,
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

export default withNavermaps(Circle);
