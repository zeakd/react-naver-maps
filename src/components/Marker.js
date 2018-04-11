import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { compose, wrapDisplayName, shallowEqual } from 'recompose'

import namedWrapper from '../utils/namedWrapper'
import withNaverEvents from '../withNaverEvents'
import withNavermaps from '../withNavermaps'

import createLogger from '../utils/createLogger'
import { MapContext } from '../contexts'
import { coordEquals, iconEquals } from '../equals'

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
  class MarkerInstance extends React.Component {    
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
      } = this.props;
  
      // get icon
      let icon = this.normalizeIcon();
  
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
      return (
        <WrappedComponent {...this.props} instance={this.marker} />
      )
    }

    normalizeIcon (_props) {
      const props = _props || this.props;
      
      const { children, icon } = props;

      if (icon) {
        return icon;
      }

      if (!children) {
        return null;
      }

      React.Children.only(children);

      const {
        size,
        anchor, 
      } = children.props;

      return {
        content: renderToStaticMarkup(children),
        size,
        anchor,
      }
    }

    componentWillReceiveProps(nextProps) {

      // this.cachedStaticMarkup = renderToStaticMarkup();
      // console.log('willReceiveProps')
      // Object.keys(this.props).forEach(key => {
      //   console.log(this.props[key], nextProps[key], this.props[key] === nextProps[key])
      // })
    }

    componentDidMount () {
  
      this.createMarkerInstance();

      // update after create instance for mount children.
      this.forceUpdate();
    }

    componentDidUpdate () {

      log('componentDidUpdate')
      this.updateMarkerInstance();
    }

    componentWillUnmount () {
  
      // remove marker from map before unmount
      this.marker && this.marker.setMap(null);
    }

    shouldComponentUpdate (nextProps) {

      // log('shouldComponentUpdate');
      const {
        position: currentPosition,
        children: _currentChildren,
        icon: _currentIcon,
        ...restCurrentProps
      } = this.props;

      const {
        position: nextPosition,
        children: _nextChildren,
        icon: _nextIcon,
        ...restNextProps
      } = nextProps;

      const currentIcon = this.normalizeIcon(this.props);
      const nextIcon = this.normalizeIcon(nextProps);
      
      // log('icons', currentIcon, nextIcon);
      // log('position', currentPosition, nextPosition)
      // log('rest', restCurrentProps, restNextProps)

      const equality = 
        shallowEqual(restCurrentProps, restNextProps) 
        && coordEquals(currentPosition, nextPosition)
        && iconEquals(currentIcon, nextIcon);
      
      // log(
      //   equality, 
      //   shallowEqual(restCurrentProps, restNextProps), 
      //   coordEquals(currentPosition, nextPosition),
      //   iconEquals(currentIcon, nextIcon)
      // );

      return !equality;
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

const MarkerWithContext = props => {
  return (
    <MapContext.Consumer>
      {map => <Marker {...props} map={map} />}
    </MapContext.Consumer>
  )
}

export default MarkerWithContext;