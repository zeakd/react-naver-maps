import React from 'react'
import ReactDOM from 'react-dom'
import loadJs from 'load-js'
import Loadable from 'react-loadable'
import { Map as NaverMap, withNavermaps } from '../../dist/react-naver-maps.es'

const App = 
  withNavermaps()(
    class extends React.Component {
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
  )

const CLIENT_ID = process.env.CLIENT_ID;

const NaverMapLoadable = Loadable({
  loader: () => loadJs(
    `https://openapi.map.naver.com/openapi/v3/maps.js?clientId=${CLIENT_ID}`
  ).then(() => window.naver.maps),

  render(navermaps, props) {
    return <App {...props} />
  },
  
  loading(props) {
    if (props.error) {
      return <div>Error!</div>;
    } else if (props.pastDelay) {
      return <div>Loading...</div>;
    } else {
      return null;
    }
  }
})

ReactDOM.render(<NaverMapLoadable />, document.getElementById('root'))