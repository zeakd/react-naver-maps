import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { compose, wrapDisplayName } from 'recompose'

import namedWrapper from '../utils/namedWrapper'
import withNaverEvents from '../withNaverEvents'
import withNavermaps from '../withNavermaps'

import createLogger from '../utils/createLogger'

const log = createLogger('Marker');

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
  'doubletap'
]

const withMarkerInstance = WrappedComponent =>  {
  class MarkerInstance extends React.PureComponent {    
    createMarkerInstance () {
      const {
        navermaps,
      } = this.props;
  
      this.marker = new navermaps.Marker();
      return this.marker;
    }
  
    updateMarkerInstance () {
      const { 
        // navermaps,
  
        // marker option
        animation,
        map,
        position,
        shape,
        title,
        cursor,
        clickable,
        draggable,
        visible,
        zIndex,
  
        // children is for icon.
        children,
      } = this.props;
  
      // get icon
      let icon = this.props.icon;
  
      // if there is no props.icon, use child component.
      if (!icon && children && React.Children.only(children) && children.props) {
        const {
          size,
          anchor,
        } = children.props;
  
        icon = {
          content: renderToStaticMarkup(children),
          size,
          anchor,
        };
      }
  
      // set options to update marker
      this.marker.setOptions({
        map,
        position,
        animation,
        icon,
        shape,
        title,
        cursor,
        clickable,
        draggable,
        visible,
        zIndex,
      })
    }

    render () {
      return <WrappedComponent {...this.props} instance={this.marker} />
    }

    componentDidMount () {
  
      this.createMarkerInstance();

      // update after create instance for mount children.
      this.forceUpdate();
    }

    componentDidUpdate () {

      this.updateMarkerInstance();
    }

    componentWillUnmount () {
  
      // remove marker from map before unmount
      this.marker && this.marker.setMap(null);
    }
  }

  MarkerInstance.defaultProps = {
    naverEventNames,
  }

  MarkerInstance.displayName = wrapDisplayName(WrappedComponent, 'withNaverMarkerInstance');

  return MarkerInstance;
}

// copmose Marker Component
const Marker = compose(
  namedWrapper('NaverMarker'),
  withNavermaps(),
  withMarkerInstance,
  withNaverEvents,
)(function NaverMarkerDOM () {
  return null;
});

Marker.defaultProps = {
  title: null,
  cursor: 'pointer',
  clickable: true,
  draggable: false,
  visible: true,
};


export default Marker;