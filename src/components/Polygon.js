import React from "react";
import { compose, wrapDisplayName } from "recompose";
import withNavermaps from '../withNavermaps'
import withNaverEvents from '../withNaverEvents';
import withMap from '../withMap'

function withPolygonKVO(WrappedComponent) {
  class PolygonKVO extends React.PureComponent{
    render () {
      return (
        <WrappedComponent 
          {...this.props}
          instance={this.polygon} 
        />
      )
    }

    updatePolygon() {
      const {
        map,
        paths,
        strokeWeight,
        strokeOpacity,
        strokeColor,
        strokeStyle,
        strokeLineCap,
        strokeLineJoin,
        fillColor,
        fillOpacity,
        clickable,
        visible,
        zIndex,
      } = this.props;

      this.polygon.setOptions({
        map,
        paths,
        strokeWeight,
        strokeOpacity,
        strokeColor,
        strokeStyle,
        strokeLineCap,
        strokeLineJoin,
        fillColor,
        fillOpacity,
        clickable,
        visible,
        zIndex,
      })
    }

    createPolygon() {

      const { navermaps } = this.props;
      this.polygon = new navermaps.Polygon();
    }

    destroyPolygon() {

      this.polygon.setMap(null) 
      this.polygon = null
    }

    componentDidUpdate() {

      this.updatePolygon();
    }

    componentDidMount() {

      this.createPolygon();
      this.forceUpdate()
    }

    componentWillUnmount() {
      
      this.destroyPolygon()
    }
  }

  PolygonKVO.displayName = wrapDisplayName(WrappedComponent, "withPolygonKVO")

  return PolygonKVO
}

// composite hocs to make Polygon Component
const Polygon = compose(
  withNavermaps(),
  withMap,
  withPolygonKVO,
  withNaverEvents,
)(function PolygonDOM() {

  // component show nothing. 
  // but, named function would be used in debuging
  return null
});

Polygon.defaultProps = {

  // use default events in navermaps docs
  // https://navermaps.github.io/maps.js/docs/naver.maps.Polygon.html#toc28__anchor
  naverEventNames: [
    'click',
    'clickable_changed',
    'dblclick',
    'mousedown',
    'mouseout',
    'mouseover',
    'mouseup',
    'visible_changed',
    'zIndex_changed',
  ]
}

export default Polygon