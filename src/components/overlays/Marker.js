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

const pickMarkerOptions = pick([
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
])

/**
 * 
 * @param {*} props 
 */
function Marker(props) {
  return (
    <Overlay 
      {...props}
      OverlayView={props.navermaps.Marker}
      pickOverlayOptions={pickMarkerOptions}
    />
  )
}

Marker.defaultProps = {
  events: [
    'animation_changed',
    'click',
    'clickable_changed',
    'dblclick',
    'draggable_changed',
    'icon_changed',
    'mousedown',
    'mouseout',
    'mouseover',
    'mouseup',
    'position_changed',
    'shape_changed',
    'title_changed',
    'visible_changed',
    'zIndex_changed',
  ],
  title: null,
  cursor: 'pointer',
  clickable: true,
  draggable: false,
  visible: true,
}

Marker.propTypes = {
  events: PropTypes.arrayOf(PropTypes.string),
  position: PropTypes.any.isRequired,
  animation: PropTypes.number,
  icon: PropTypes.any,
  shape: PropTypes.object,
  title: PropTypes.string,
  cursor: PropTypes.string,
  draggable: PropTypes.bool,
  clickable: PropTypes.bool,
  visible: PropTypes.bool,
  zIndex: PropTypes.number,
}

export default withNavermaps(Marker)
