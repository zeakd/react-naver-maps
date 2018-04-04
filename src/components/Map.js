import React from 'react'
import ResizeDetector from 'react-resize-detector'
import invariant from 'invariant'

// 이거들 부터.
import debug from 'debug'
import { pick, isEmpty, debounce } from 'lodash'

import createLogger from '../utils/createLogger'
import compose from '../utils/compose'
import withNavermaps from '../withNavermaps'
import withNaverEvents from '../withNaverEvents'

const pickMapOptions = obj => pick(obj, [
  'background',
  'baseTileOpacity',
  'disableDoubleClickZoom',
  'disableDoubleTapZoom',
  'disableKineticPan',
  'disableTwoFingerTapZoom',
  'draggable',
  'keyboardShortcuts',
  'logoControl',
  'logoControlOptions',
  'mapDataControl',
  'mapDataControlOptions',
  'mapTypeControl',
  'mapTypeControlOptions',
  'mapTypes',
  'maxBounds',
  'maxZoom',
  'minZoom',
  'padding',
  'pinchZoom',
  'resizeOrigin',
  'scaleControl',
  'scaleControlOptions',
  'scrollWheel',
  'overlayZoomEffect',
  'tileSpare',
  'tileTransition',
  'zoomControl',
  'zoomControlOptions',
  'zoomOrigin',
])

/**
 * 1. props로 listener를 받아 instance에 addListener
 * 2. mount시 map인스턴스를 생성
 * 3. unmount시 map인스턴스를 파괴
 * 4. props를 받아 map인스턴스를 업데이트
 * 5. updating중에는 event를 발생시키지 않고, 업데이트도 패스.
 * 6. overscrolling중에는 updating block.
 */

 /**
  * mount
  * 
  * render dom
  * create instance (component did mount) - check overscrolling, clear updating
  * 
  * addListener (component did update)
  * update instance (component did update) - fire updating, block when updating
  * 
  * 
  * destroy instance (component will unmount)
  * 
  * unmount
  */
 
const log = createLogger('Map');

class MapDOM extends React.Component  {
  constructor (props) {
    super(props);

    this.handleResize = this.handleResize.bind(this);
  }

  handleResize (width, height) {
    const { instance } = this.props;

    // resize map on wrapping div resized
    if (instance) {
      instance.setSize({
        width, height
      })
    }
  }

  render () {
    const { id, className, mapDivId, children, instance } = this.props;

    return (
      <div id={id} className={className}>
        <div id={mapDivId} style={{ width: "100%", height: "100%" }}/>
        <ResizeDetector handleWidth handleHeight onResize={this.handleResize}/>

        {/* render empty Children(Overlay, Control, etc) */}
        {/* {instance && React.Children.map(children, (child) => {
          return React.cloneElement(child, { naver: window.naver, map: this.map, key: child.key || uuid() });
        })} */}
      </div>
    )
  }
};

const defaultProps = {
  mapDivId: 'naver-map',
  zoomEffect: false,

  // size,
  // bounds,
  // center,
  // zoom,
  // mapTypeId,

  // background,
  // baseTileOpacity,
  // disableDoubleClickZoom,
  // disableDoubleTapZoom,
  // disableKineticPan,
  // disableTwoFingerTapZoom,
  // draggable,
  // keyboardShortcuts,
  // logoControl,
  // logoControlOptions,
  // mapDataControl,
  // mapDataControlOptions,
  // mapTypeControl,
  // mapTypeControlOptions,
  // mapTypes,
  // maxBounds,
  // maxZoom,
  // minZoom,
  // padding,
  // pinchZoom,
  // resizeOrigin,
  // scaleControl,
  // scaleControlOptions,
  // scrollWheel,
  // overlayZoomEffect,
  // tileSpare,
  // tileTransition,
  // zoomControl,
  // zoomControlOptions,
  // zoomOrigin,
}

const withNaverMapInstance = WrappedComponent => {
  class MapInstance extends React.PureComponent {
    constructor (props) {
      super(props);

      // while updating = true, update are banned 
      // until idle or new panning, zooming start
      this.updating = false;
      this.reupdateTimeout = 0;

      // to check overScrolling bug
      this.scrolling = false;
      this.scrollingEndTimeout = 0;

      this.handleCenterChanged = this.handleCenterChanged.bind(this);
      this.handleBoundsChanged = this.handleBoundsChanged.bind(this);

      this.updateMapInstance = debounce(this.updateMapInstance, 0)
    }

    // clear updating state.
    clearUpdating () {

      // log('UPDATING CLEAR')
      clearTimeout(this.reupdateTimeout);
      this.updating = false;
    }

    // create map instance
    createMapInstance () {
      log('MAP INSTANCE %cCREATE', 'background: black; color: red;')

      const {
        navermaps, 

        // TODO: change to lodash.pick
        center,
        zoom,
        mapTypeId,
        size,
        bounds,
        
        mapDivId
      } = this.props;
      
      // create navermap instance
      const mapOptions = {};
  
      if (center) { mapOptions.center = center }
      if (zoom) { mapOptions.zoom = zoom }
      if (mapTypeId) { mapOptions.mapTypeId = mapTypeId }
      if (size) { mapOptions.size = size }
      if (bounds) { mapOptions.bounds = bounds }
      log('map options', mapDivId, mapOptions)
  
      this.map = new navermaps.Map(mapDivId, mapOptions);
      invariant(this.map, 'naver.maps.Map instance creation failure') 
  
      // there is a macos inertial scroll bug. 
      // check user scrolling
      // scroll event occur on mavdivId > div > div
      const scrollDiv = document.querySelector(`#${mapDivId} > div > div`)
  
      if (scrollDiv) {
        scrollDiv.addEventListener('mousewheel', (e) => {
          
          // clear the timeout trying to set flag false
          clearTimeout(this.scrollingEndTimeout);
  
          // set overscolling flag true
          this.scrolling = true
  
          // try to set the flag false
          this.scrollingEndTimeout = setTimeout(() => {
            this.scrolling = false;
  
            // provide blocking when overscroll during panning.
            if (this.updating) {
              
              this.clearUpdating();
              this.forceUpdate();
            }
          }, 50)
        }, false)
      }
  
      // whenever user zoom during 'updating', unblock updating.
      this.map.addListener('zooming', () => {
  
        // log('%cZOOMING!', 'background: #222; color: #bada55');
        this.clearUpdating();
      })
  
      // whenever update finish, unblock updating.
      this.map.addListener('idle', () => {
  
        // log('%cIDLE!', 'background: #222; color: #bada55');
        this.clearUpdating();
      })
    }
  
    updateMapInstance () {
      log ("updateInstance");
      // do not use destructing for size, bounds, center, zoom, mapTypeId
      // they can be asyncly changed during updateInstance.
  
      const { 
        zoomEffect, 
        transitionOptions
      } = this.props;
  
      // panning issue
      //
      // issue: macos inertial scrolling cause panTo bug when try to zoom > 14
      // pending update until scrolling is over.
      
      // clear reupdateTimeout first
      clearTimeout(this.reupdateTimeout);
      
      // retry update.
      if (
        // bug condition.
        (this.props.zoom === 14 && this.scrolling)
  
        // // is updating
        // || this.updating
      ) {
  
        // blocking update
        log('updateInstance RETRY');

        // retry after timeout 
        this.reupdateTimeout = setTimeout(() => {
          this.forceUpdate();
        }, 50)
  
        return;
      } 
  
      // update
      log('updateInstance UPDATE!')

      // setting properties issue
      //
      // issue 1: setZoom and panTo can not be executed in parallel. 
      // issue 2: morph clear view before move. 
      // issue 3: zooming bug with morph 
      // (repeat zoom in and out with debounce. morph always take times because of animation)
      //
      // zoom first to avoid issue 1
  
      // set zoom if need
      if (this.props.zoom !== this.map.getZoom()) {
  
        log('UPDATE ZOOM', this.map.getZoom(), this.props.zoom)
        this.updating = true;
        this.map.setZoom(this.props.zoom, zoomEffect);
      }
        
      // set center
      if (this.props.center && !this.props.center.equals(this.map.getCenter())) {
  
        log('updateInstance UPDATE %cCENTER', 'background: #222; color: red', this.map.getCenter(), this.props.center)
        this.updating = true;
        this.map.panTo(this.props.center, transitionOptions);
      }
  
      // // set else this.map options
      // const mapOptions = pickMapOptions(this.props);
  
      // // TODO: deep check mapOptions 
      // if (!isEmpty(mapOptions)) {
  
      //   this.map.setOptions(mapOptions);
      // }
    }
  
    destroyMapInstance () {
      // log('KVO INSTANCE %cDESTROY', 'background: black; color: red;')
      this.map.destroy();
    }

    // proxy onCenterChanged. for blocking when update.
    handleCenterChanged (...args) {
      const center = args[0];
      const {
        navermaps
      } = this.props;
  
      log('handleCenterChagned');
      new navermaps.Marker({
        position: center.clone(),
        map: this.map
      })

      
      if (!this.updating) this.props.onCenterChanged(...args)
    }

    // proxy onBoundsChanged for blocking when update.
    handleBoundsChanged (...args) {

      if (!this.updating) this.props.onBoundsChanged(...args)
    }

    render () {
      return (
        <WrappedComponent 
          {...this.props} 
          instance={this.map}
          onCenterChanged={this.props.onCenterChanged && this.handleCenterChanged}
          onBoundsChanged={this.props.onBoundsChanged && this.handleBoundsChanged}
        />
      )
    }

    componentDidMount () {
      this.createMapInstance();
      this.forceUpdate();
    }

    componentDidUpdate () {
      this.updateMapInstance();
    }

    componentWillUnmount () {
      if (this.map) this.destroyMapInstance();
    }
  }

  // MapInstance component default props
  MapInstance.defaultProps = {
    naverEventNames: [
      'addLayer',
      'click',
      'dblclick',
      'doubletap',
      'drag',
      'dragend',
      'dragstart',
      'idle',
      'keydown',
      'keyup',
      'longtap',
      'mousedown',
      'mousemove',
      'mouseout',
      'mouseover',
      'mouseup',
      'panning',
      'pinch',
      'pinchend',
      'pinchstart',
      'removeLayer',
      'resize',
      'rightclick',
      'tap',
      'tilesloaded',
      'touchend',
      'touchmove',
      'touchstart',
      'twofingertap',
      'zooming',
      'mapType_changed',
      'mapTypeId_changed',
      'size_changed',
      'bounds_changed',
      'center_changed',
      'centerPoint_changed',
      'projection_changed',
      'zoom_changed',
    ],
    zoomEffect: false,
  }

  const name = WrappedComponent.displayName || WrappedComponent.name;
  MapInstance.displayName = `withNaverMapInstance(${name})`;

  return MapInstance;
}

const Composed = compose(
  withNavermaps(),
  withNaverMapInstance,
  withNaverEvents,
)(MapDOM)

Composed.defaultProps = defaultProps;

export default Composed;