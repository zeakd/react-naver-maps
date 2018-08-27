import React from "react";
import { compose, wrapDisplayName } from "recompose";
import withNavermaps from '../withNavermaps'
import withNaverEvents from '../withNaverEvents';
import withMap from '../withMap'

const defaultProps = {
  eventNames: []
}

function withPolygonKVO(WrappedComponent) {
  class PolygonKVO extends React.PureComponent{
    render () {
      return <WrappedComponent />
    }

    updatePolygon() {

    }

    createPolygon() {
      
      const { navermaps, map, paths } = this.props;

      this.polygon = new navermaps.Polygon({
        map,
        paths,
        fillColor: "#ff0000",
        fillOpacity: 0.3,
        strokeColor: "#ff0000",
        strokeOpacity: 0.6,
        strokeWeight: 3
      });
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
    }

    componentWillUnmount() {
      this.destroyPolygon()
    }
  }

  PolygonKVO.displayName = wrapDisplayName(WrappedComponent, "withPolygonKVO")

  return PolygonKVO
}

const Polygon = compose(
  withNavermaps(),
  withMap,
  withPolygonKVO,
  withNaverEvents,
)(function Polygon() {
  return null
});

export default Polygon