import React from 'react'
import ReactDOM from 'react-dom'
import loadJs from 'load-js'
import Loadable from 'react-loadable'
import { BrowserRouter as Router, withRouter, Route } from 'react-router-dom'
import { compose } from 'recompose'
import qs from 'query-string'

import { Map as NaverMap, withNavermaps } from '../../dist/react-naver-maps.es'
import { pseudoRandomBytes } from 'crypto';

/**
 * make location.search
 */
const makeSearch = (search, params) => qs.stringify(
  Object.assign(
    qs.parse(search), 
    params)
  )

/**
 * Our Map Module
 */
const AppMap = compose(
  withNavermaps(),
  withRouter,
)(
  class extends React.Component {
    constructor (props) {
      super(props);
  
      //
      // initialize process
      //
      const { navermaps, location } = props;
  
      // parse center from querystring
      const parsed = qs.parse(location.search);

      // initial center and zoom
      const center = parsed.lat && parsed.lng
        ? new navermaps.LatLng(parsed.lat, parsed.lng)
        : new navermaps.LatLng(37.3595704, 127.105399);
      const zoom = parsed.zoom 
        ? Number(parsed.zoom) 
        : 12;

      // initialize state
      this.state = {
        zoom,
        center,
      }
  
      // bind methods
      this.handleCenterChanged = this.handleCenterChanged.bind(this);
      this.handleZoomChanged = this.handleZoomChanged.bind(this);
      this.handleIdle = this.handleIdle.bind(this);
    }
  
    handleIdle () {
      const { zoom, center } = this.state;

      // update url params
      this.props.history.replace({
        pathname: this.props.location.pathname,
        search: makeSearch(this.props.location.search, {
          lat: center.lat(),
          lng: center.lng(),
          zoom,
        })
      })
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
        <NaverMap
          style={{ width: "400px", height: "500px" }}

          zoom={zoom}
          onZoomChanged={this.handleZoomChanged}
          
          center={center}
          onCenterChanged={this.handleCenterChanged}

          onIdle={this.handleIdle}
        />
      )
    }
  }
)

/**
 * NaverMapLoadable
 * async load naver maps module
 */
const CLIENT_ID = process.env.CLIENT_ID;

const NaverMapLoadable = Loadable({
  loader: () => loadJs(
    `https://openapi.map.naver.com/openapi/v3/maps.js?clientId=${CLIENT_ID}`
  ).then(() => window.naver.maps),

  render(navermaps, props) {
    return <AppMap {...props} />
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


/**
 * App
 * main entrance.
 */
class App extends React.Component {
  render () {
    return (
      <div style={{ width: "100%", height: "100%" }}>
        <h1>React-Router URL querystring example</h1>
        <p>Feel free to refresh after moving position.</p>
        <p>
          lat, lng, zoom are recorded on url,
          and rendered on mount.
        </p>
        <p>
          so, user can copy and paste url for remenber the map state, and send to others. 
        </p>
        <Route path='/' component={NaverMapLoadable} /> 
      </div>
    );
  }
}


ReactDOM.render(
  <Router>
    <App />
  </Router>, document.getElementById('root'))