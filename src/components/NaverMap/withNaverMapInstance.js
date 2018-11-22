import React, { Component } from 'react';
import debounce from 'lodash.debounce';
import { wrapDisplayName } from 'recompose';
import invariant from 'invariant';

import pick from '../../utils/pick';

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
  'mapType',
  'mapTypeId',
  'size',
  'bounds',
  'center',
  'centerPoint',
  'projection',
  'zoom',
];

const defaultKVOKeyMap = {
  defaultMapType: 'mapType',
  defaultMapTypeId: 'mapTypeId',
  defaultSize: 'size',
  defaultBounds: 'bounds',
  defaultCenter: 'center',
  defaultCenterPoint: 'centerPoint',
  defaultProjection: 'projection',
  defaultZoom: 'zoom',
}

const defaultKVOKeys = kvoKeys.map(key => {
  return 'default' + key[0].toUpperCase() + key.substring(1, key.length);
})

const pickMapOptions = pick(mapOptionKeys);
const pickKVOOptions = pick(kvoKeys);
const pickDefaultKVOKeys = pick(defaultKVOKeys);

const withNaverMapInstance = WrappedComponent => {
  class Wrapper extends Component {
    constructor(props) {
      super(props);

      this.lazyUpdateKVO = debounce(this.lazyUpdateKVO, 0);
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

    // shouldComponentUpdate(nextProps) {
    //   // child changed
    //   // kvo is not equals
    //   // option changed
    //   // handler Changed
    // }

    componentDidUpdate() {
      this.updateMap();
    }

    // componentWillUnmount() {
    //   console.log('map instance unmount');
    // }

    async lazyUpdateKVO({ zoom, center, bounds, size, mapTypeId }) {
      // console.log('--- lazy update ---');
      if (this.break) {
        this.break = false;
        return;
      }

      const shouldUpdateZoom = zoom && this.map.getZoom() !== zoom;
      const shouldUpdateCenter = center && !this.map.getCenter().equals(center);
      const shouldUpdateBounds = bounds && !this.map.getBounds().equals(bounds);
      const shouldUpdateSize = size && !this.map.getSize().equals(size);
      const shouldUpdateMapTypeId = mapTypeId && this.map.getMapTypeId() !== mapTypeId;

      const { transitionOptions }= this.props;

      if (shouldUpdateZoom && shouldUpdateCenter) {
        // console.log('zoom, center updated');
        // onUpdateStart();

        this.updating = true;
        this.map.morph(center, zoom, transitionOptions);
      } else {
        if (shouldUpdateCenter) {
          // console.log('center updated');
          // onUpdateStart();

          this.updating = true;
          this.map.panTo(center, transitionOptions);
        }

        if (shouldUpdateZoom) {
          // console.log('zoom updated');
          // onUpdateStart();

          this.updating = true;
          this.map.setZoom(zoom);
        }
      }

      if (shouldUpdateSize) {
        this.map.setSize(size);
      }

      if (shouldUpdateMapTypeId) {
        this.map.setMapTypeId(mapTypeId);
      }

      // bounds, size, mapType, MapTypeId, centerPoint, projection changed
    }

    updateMap() {
      const { zoom, center, bounds, size, mapTypeId } = this.props;

      // cancel updating state when do force update.
      if ((center && center.force) || (bounds && bounds.force)) {
        this.updating = false;
      }

      if (this.updating) {
        // console.log('--- drop update --- ');
        return;
      }

      // console.log('--- updating ---');
      this.lazyUpdateKVO({ zoom, center, bounds, size, mapTypeId });

      

      // console.log('mapTypeId', mapTypeId)
      const mapOptions = pickMapOptions(this.props);
      this.map.setOptions({
        ...mapOptions,
      });

      

      // this.map.setMapTypeId(mapTypeId)
      
    }

    createMap() {
      const { navermaps, id } = this.props;

      invariant(
        id,
        'react-naver-maps: <Map /> - props.id is required',
      );

      const mapOptions = pickMapOptions(this.props);
      const kvoOptions = pickKVOOptions(this.props);
      const defaultKVOOptions = pickDefaultKVOKeys(this.props);
      
      const allMapOptions = {
        ...mapOptions,
        ...kvoOptions,
      }

      Object.keys(defaultKVOOptions).forEach(defaultKey => {
        // console.log(defaultKey, defaultKVOKeyMap[defaultKey], defaultKVOOptions[defaultKey])
        allMapOptions[defaultKVOKeyMap[defaultKey]] = defaultKVOOptions[defaultKey];
      })
      
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

      // clear updating state
      this.map.addListener('idle', () => {
        this.updating = false;
        this.break = true;
      });
      this.map.addListener('zooming', () => {
        this.updating = false;
        this.break = true;
      });
      this.map.addListener('mousedown', () => {
        // console.log('mousedown');
        this.updating = false;
        this.break = true;
      });
      this.map.addListener('dragstart', () => {
        // console.log('dragstart');
        this.updating = false;
        this.break = true;
      });
      this.map.addListener('pinchstart', () => {
        // console.log('pinchstart');
        this.updating = false;
        this.break = true;
      });

      this.props.registerEventInstance(this.map);
    }

    render() {
      const { children, ...restProps } = this.props;

      return (
        <WrappedComponent {...restProps}>
          {this.map &&
            React.Children.map(children, child => {
              // console.log(child);
              if (child) {
                return <child.type {...child.props} map={this.map} />;
              }

              return child;
            })}
        </WrappedComponent>
      );
    }
  }

  Wrapper.displayName = wrapDisplayName(
    WrappedComponent,
    'withNaverMapInstance',
  );

  return Wrapper;
};

export default withNaverMapInstance;
