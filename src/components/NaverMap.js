import React from 'react';
import PropTypes from 'prop-types';
import invariant from 'invariant';
import { compose } from 'recompose';
import shallowequal from 'shallowequal';
import MapContext from '../MapContext';
import pick from '../utils/pick';

import { withNavermaps, bridgeEventHandlers, injectNaverRef } from '../hocs';

const mapOptionKeys = [
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
];

const kvoKeys = [
  'mapTypeId',
  'size',
  'bounds',
  'center',
  'centerPoint',
  'zoom',
];

const defaultKVOKeyMap = {
  defaultMapTypeId: 'mapTypeId',
  defaultSize: 'size',
  defaultBounds: 'bounds',
  defaultCenter: 'center',
  defaultCenterPoint: 'centerPoint',
  defaultZoom: 'zoom',
};

const defaultKVOKeys = kvoKeys.map(key => {
  return 'default' + key[0].toUpperCase() + key.substring(1, key.length);
});

const pickMapOptions = pick(mapOptionKeys);
const pickKVOOptions = pick(kvoKeys);
const pickDefaultKVOKeys = pick(defaultKVOKeys);

class NaverMap extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentWillUnmount() {
    if (this.instance) {
      this.instance.destroy();
    }
  }

  componentDidMount() {
    this.createMap();
    this.forceUpdate();
  }

  componentDidUpdate(prevProps) {
    const dirtyKvos = this.pickDirtyKvos(prevProps);
    if (Object.keys(dirtyKvos).length > 0) {
      this.updateKvos(dirtyKvos);
    }

    if (this.shouldMapOptionsUpdate(prevProps)) {
      this.updateMapOptions();
    }
  }

  pickDirtyKvos(prevProps) {
    const { mapTypeId, size, bounds, center, centerPoint, zoom } = this.props;
    const dirties = {};

    if (
      mapTypeId !== prevProps.mapTypeId &&
      this.getMapTypeId() !== mapTypeId
    ) {
      dirties.mapTypeId = mapTypeId;
    }

    if (size !== prevProps.size && !this.getSize().equals(size)) {
      dirties.size = size;
    }

    if (zoom !== prevProps.zoom && this.getZoom() !== zoom) {
      dirties.zoom = zoom;
    }

    if (bounds !== prevProps.bounds && !this.getBounds().equals(bounds)) {
      dirties.bounds = bounds;
    }

    if (center !== prevProps.center && !this.getCenter().equals(center)) {
      dirties.center = center;
    }

    if (
      centerPoint !== prevProps.centerPoint &&
      !this.getCenterPoint().equals(centerPoint)
    ) {
      dirties.centerPoint = centerPoint;
    }

    if (zoom !== prevProps.zoom && this.getZoom() !== zoom) {
      dirties.zoom = zoom;
    }

    return dirties;
  }

  updateKvos(kvos) {
    const { transitionOptions } = this.props;
    const { mapTypeId, size, bounds, center, centerPoint, zoom } = kvos;

    if (mapTypeId) {
      this.setMapTypeId(mapTypeId);
    }

    if (size) {
      this.updating = true;
      this.setSize(size);
    }

    if (centerPoint) {
      this.updating = true;
      this.setCenterPoint(centerPoint);
    }

    if (bounds) {
      this.updating = true;
      this.panToBounds(bounds);
    } else {
      if (center && zoom) {
        this.updating = true;
        this.morph(center, zoom, transitionOptions);
      } else {
        if (center) {
          this.updating = true;
          this.panTo(center, transitionOptions);
        }

        if (zoom) {
          this.updating = true;
          this.setZoom(zoom);
        }
      }
    }
  }

  shouldMapOptionsUpdate(prevProps) {
    return !shallowequal(pickMapOptions(this.props), pickMapOptions(prevProps));
  }

  updateMapOptions() {
    const mapOptions = pickMapOptions(this.props);
    this.setOptions({
      ...mapOptions,
    });
  }

  /**
   * createMap
   *
   * create map instance with props.
   */
  createMap() {
    const { navermaps, id, registerEventInstance } = this.props;

    invariant(id, 'react-naver-maps: <Map /> - props.id is required');

    const mapOptions = pickMapOptions(this.props);
    const kvoOptions = pickKVOOptions(this.props);
    const defaultKVOOptions = pickDefaultKVOKeys(this.props);

    const allMapOptions = {
      ...mapOptions,
      ...kvoOptions,
    };

    Object.keys(defaultKVOOptions).forEach(defaultKey => {
      allMapOptions[defaultKVOKeyMap[defaultKey]] =
        defaultKVOOptions[defaultKey];
    });

    try {
      this.instance = new navermaps.Map(id, allMapOptions);
    } catch (e) {
      invariant(
        false,
        `react-naver-maps: <Map /> - please check <div id=#${id}> is correctly mounted`,
      );
    }

    // alias
    this.map = this.instance;
    registerEventInstance(this.map);

    // clear updating state
    this.map.addListener('idle', () => {
      this.updating = false;
    });
  }

  /**
   * Add pane
   * @public
   * @param {string} name
   * @param {HTMLElement|number} elementOrZIndex
   */
  addPane(...args) {
    return this.map.addPane(...args);
  }

  /**
   * @public
   */
  destroy() {
    return this.map.destroy();
  }

  /**
   * fit bounds
   * @public
   * @param  {object} bounds
   * @param  {object} margin
   */
  fitBounds(...args) {
    return this.map.fitBounds(...args);
  }
  /**
   *
   * @param  {...any} args
   * @public
   */
  getBounds() {
    return this.map.getBounds();
  }
  /**
   *
   * @param  {...any} args
   * @public
   */
  getCenter() {
    return this.map.getCenter();
  }
  /**
   *
   * @param  {...any} args
   * @public
   */
  getCenterPoint() {
    return this.map.getCenterPoint();
  }
  /**
   *
   * @param  {...any} args
   * @public
   */
  getElement() {
    return this.map.getElement();
  }
  /**
   *
   * @param  {...any} args
   * @public
   */
  getMapTypeId() {
    return this.map.getMapTypeId();
  }
  /**
   *
   * @param  {...any} args
   * @public
   */
  getOptions() {
    return this.map.getOptions();
  }
  /**
   *
   * @param  {...any} args
   * @public
   */
  getPanes() {
    return this.map.getPanes();
  }
  /**
   *
   * @param  {...any} args
   * @public
   */
  getPrimitiveProjection() {
    return this.map.getPrimitiveProjection();
  }
  /**
   *
   * @param  {...any} args
   * @public
   */
  getProjection() {
    return this.map.getProjection();
  }

  /**
   *
   * @param  {...any} args
   * @public
   */
  getSize() {
    return this.map.getSize();
  }

  /**
   *
   * @param  {...any} args
   * @public
   */
  getZoom() {
    return this.map.getZoom();
  }

  /**
   *
   * @param  {...any} args
   * @public
   */
  morph(...args) {
    return this.map.morph(...args);
  }

  /**
   *
   * @param  {...any} args
   * @public
   */
  panBy(...args) {
    return this.map.panBy(...args);
  }
  /**
   *
   * @param  {...any} args
   * @public
   */
  panTo(...args) {
    return this.map.panTo(...args);
  }

  /**
   *
   * @param  {...any} args
   * @public
   */
  panToBounds(...args) {
    return this.map.panToBounds(...args);
  }

  /**
   *
   * @param  {...any} args
   * @public
   */
  refresh(...args) {
    return this.map.refresh(...args);
  }

  /**
   *
   * @param  {...any} args
   * @public
   */
  removePane(...args) {
    return this.map.removePane(...args);
  }

  /**
   *
   * @param  {...any} args
   * @public
   */
  setCenter(...args) {
    return this.map.setCenter(...args);
  }

  /**
   *
   * @param  {...any} args
   * @public
   */
  setCenterPoint(...args) {
    return this.map.setCenterPoint(...args);
  }

  /**
   *
   * @param  {...any} args
   * @public
   */
  setMapTypeId(...args) {
    return this.map.setMapTypeId(...args);
  }

  /**
   *
   * @param  {...any} args
   * @public
   */
  setOptions(...args) {
    return this.map.setOptions(...args);
  }

  /**
   *
   * @param  {...any} args
   * @public
   */
  setSize(...args) {
    return this.map.setSize(...args);
  }

  /**
   *
   * @public
   * @param  {...any} args
   */
  setZoom(...args) {
    return this.map.setZoom(...args);
  }

  /**
   *
   * @public
   * @param  {...any} args
   */
  updateBy(...args) {
    return this.map.updateBy(...args);
  }

  /**
   *
   * @param  {...any} args
   * @public
   */
  zoomBy(...args) {
    return this.map.zoomBy(...args);
  }

  render() {
    const { id, style, className, children } = this.props;

    return (
      <MapContext.Provider value={this.map}>
        <div id={id} className={className} style={style}>
          {children}
        </div>
      </MapContext.Provider>
    );
  }
}

/**
 *  @visibleName NaverMap
 */

NaverMap.propTypes = {
  navermaps: PropTypes.object.isRequired,
  registerEventInstance: PropTypes.func.isRequired,

  id: PropTypes.string,
  style: PropTypes.object,
  className: PropTypes.string,
  children: PropTypes.node,
  events: PropTypes.arrayOf(PropTypes.string),
  disableDoubleClickZoom: PropTypes.bool,
  disableDoubleTapZoom: PropTypes.bool,
  disableKineticPan: PropTypes.bool,
  disableTwoFingerTapZoom: PropTypes.bool,
  draggable: PropTypes.bool,
  keyboardShortcuts: PropTypes.bool,
  logoControl: PropTypes.bool,
  mapDataControl: PropTypes.bool,
  mapTypeControl: PropTypes.bool,
  maxBounds: PropTypes.object,
  pinchZoom: PropTypes.bool,
  resizeOrigin: PropTypes.number,
  scaleControl: PropTypes.bool,
  scrollWheel: PropTypes.bool,
  overlayZoomEffect: PropTypes.string,
  tileSpare: PropTypes.number,
  tileTransition: PropTypes.bool,
  zoomControl: PropTypes.bool,
  zoomOrigin: PropTypes.object,

  mapTypeId: PropTypes.number,
  size: PropTypes.object,
  bounds: PropTypes.object,
  center: PropTypes.object,
  centerPoint: PropTypes.object,
  zoom: PropTypes.number,

  transitionOptions: PropTypes.object,
};

NaverMap.defaultProps = {
  events: [
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
  id: 'react-naver-map',
  disableDoubleClickZoom: false,
  disableDoubleTapZoom: false,
  disableKineticPan: true,
  disableTwoFingerTapZoom: false,
  draggable: true,
  keyboardShortcuts: false,
  logoControl: true,
  mapDataControl: true,
  mapTypeControl: false,
  maxBounds: null,
  pinchZoom: true,
  resizeOrigin: 0,
  scaleControl: true,
  scrollWheel: true,
  overlayZoomEffect: null,
  tileSpare: 0,
  tileTransition: true,
  zoomControl: false,
  zoomOrigin: null,

  transitionOptions: null,
};

export default compose(
  withNavermaps,
  bridgeEventHandlers,
  injectNaverRef,
)(NaverMap);
