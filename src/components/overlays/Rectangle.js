/**
 * npm modules
 */
import React from 'react';
import PropTypes from 'prop-types'
import { compose } from 'recompose';
import invariant from 'invariant';

/**
 * local moduleds
 */
import Overlay from '../Overlay'
import pick from '../../utils/pick';
import { withNavermaps } from '../../hocs';

const pickRectangleOptions = pick([
  'bounds',
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
])

/**
 * 
 * @param {*} props 
 */
function Rectangle(props) {
  return (
    <Overlay 
      {...props}
      OverlayView={props.navermaps.Rectangle}
      pickOverlayOptions={pickRectangleOptions}
    />
  )
}

Rectangle.defaultProps = {
  events: [
    'bounds_changed',
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
}

Rectangle.propTypes = {
  events: PropTypes.arrayOf(PropTypes.string),
  bounds: PropTypes.object.isRequired,
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
}

export default withNavermaps(Rectangle)