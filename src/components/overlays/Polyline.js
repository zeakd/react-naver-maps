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

const pickPolylineOptions = pick([
  'path',
  'strokeWeight',
  'strokeOpacity',
  'strokeColor',
  'strokeStyle',
  'strokeLineCap',
  'strokeLineJoin',
  'clickable',
  'visible',
  'zIndex',
  'startIcon',
  'startIconSize',
  'endIcon',
  'endIconSize',
])

/**
 * 
 * @param {*} props 
 */
function Polyline(props) {
  return (
    <Overlay 
      {...props}
      OverlayView={props.navermaps.Polyline}
      pickOverlayOptions={pickPolylineOptions}
    />
  )
}

Polyline.defaultProps = {
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
  clickable: false,
  visible: true,
  zIndex: 0,
}

Polyline.propTypes = {
  events: PropTypes.arrayOf(PropTypes.string),
  path: PropTypes.any.isRequired,
  strokeWeight: PropTypes.number,
  strokeOpacity: PropTypes.number,
  strokeColor: PropTypes.string,
  strokeStyle: PropTypes.string,
  strokeLineCap: PropTypes.string,
  strokeLineJoin: PropTypes.string,
  clickable: PropTypes.bool,
  visible: PropTypes.bool,
  zIndex: PropTypes.number,
  startIcon: PropTypes.number,
  startIconSize: PropTypes.number,
  endIcon: PropTypes.number,
  endIconSize: PropTypes.number,
}

export default withNavermaps(Polyline)