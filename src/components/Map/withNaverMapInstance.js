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

const pickMapOptions = pick(mapOptionKeys);
const pickKVOOptions = pick(kvoKeys);

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

    async lazyUpdateKVO({ zoom, center, bounds, size }) {
      // console.log('--- lazy update ---');
      if (this.break) {
        this.break = false;
        return;
      }

      const shouldUpdateZoom = zoom && this.map.getZoom() !== zoom;
      const shouldUpdateCenter = center && !this.map.getCenter().equals(center);
      const shouldUpdateBounds = bounds && !this.map.getBounds().equals(bounds);
      const shouldUpdateSize = size && !this.map.getSize().equals(size);

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

      // bounds, size, mapType, MapTypeId, centerPoint, projection changed
    }

    updateMap() {
      const { zoom, center, bounds, size } = this.props;

      // cancel updating state when do force update.
      if ((center && center.force) || (bounds && bounds.force)) {
        this.updating = false;
      }

      if (this.updating) {
        // console.log('--- drop update --- ');
        return;
      }

      // console.log('--- updating ---');
      
      this.lazyUpdateKVO({ zoom, center, bounds, size });

      const mapOptions = pickMapOptions(this.props);
      this.map.setOptions(mapOptions);
    }

    createMap() {
      const { navermaps, mapDivId } = this.props;

      invariant(
        mapDivId,
        'react-naver-maps: <Map /> - props.mapDivId is required',
      );

      const mapOptions = pickMapOptions(this.props);
      const kvoOptions = pickKVOOptions(this.props);

      try {
        this.instance = new navermaps.Map(mapDivId, {
          ...mapOptions,
          ...kvoOptions,
        });
      } catch (e) {
        invariant(
          false,
          `react-naver-maps: <Map /> - please check <div id=#${mapDivId}> is correctly mounted`,
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

      this.props.registerInstance(this.map);
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
