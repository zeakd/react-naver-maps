import React from 'react'
import ReactDOM from 'react-dom'
import loadJs from 'load-js'
import Loadable from 'react-loadable'
import { 
  Map as NaverMap, 
  withNavermaps,
  loadNavermapsScript,
} from '../../dist/react-naver-maps.es'

class App extends React.Component {
  constructor (props) {
    super(props);

    const { navermaps } = props;

    this.state = {
      zoom: 12,
      center: new navermaps.LatLng(37.3595704, 127.105399)
    }

    this.handleCenterChanged = this.handleCenterChanged.bind(this);
    this.handleZoomChanged = this.handleZoomChanged.bind(this);
  }

  handleZoomChanged (zoom) {
    this.setState({ zoom })
  }

  handleCenterChanged (center) {
    this.setState({ center })
  }

  render () {
    const { center, zoom } = this.state;
    return (
      <div style={{ width: "400px", height: "500px" }}>
        <h1>Zoom, Center State example</h1>
        <p>zoom: {zoom}</p>
        <p>center: {center.toString()}</p>
        <NaverMap
          style={{ width: "100%", height: "100%" }}

          zoom={zoom}
          onZoomChanged={this.handleZoomChanged}
          
          center={center}
          onCenterChanged={this.handleCenterChanged}
        />
      </div>
    )
  }
}

const CLIENT_ID = process.env.CLIENT_ID;

class RenderOnLoaded extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      loaded: false,
    }
  }

  componentDidMount () {
    loadNavermapsScript({ clientId: CLIENT_ID })
      .then((navermaps) => {
        this.navermaps = navermaps;
        this.setState({ loaded: true })
      })
  }

  render () {
    const { loaded } = this.state;

    if (!loaded) {
      return <div>Loading</div>
    }

    return (
      <App {...this.props} navermaps={this.navermaps} />
    );
  }
}

ReactDOM.render(<RenderOnLoaded />, document.getElementById('root'))