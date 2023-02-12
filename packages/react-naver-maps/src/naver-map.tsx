import pick from 'lodash.pick';
import upperfirst from 'lodash.upperfirst';
import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { useContainerContext } from './contexts/container';
import { EventTargetContext } from './contexts/event-target';
import { NaverMapContext } from './contexts/naver-map';
import { HandleEvents } from './helpers/event';
import { usePrevious } from './hooks/use-previous';
import { useNavermaps } from './use-navermaps';

type MapPaddingOptions = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

type MapOptions = {
  background?: string;
  baseTileOpacity?: number;
  /**
   * @type naver.maps.Bounds | naver.maps.BoundsLiteral | null
   */
  bounds?: naver.maps.Bounds | naver.maps.BoundsLiteral | null;
  /**
   * @type naver.maps.Coord | naver.maps.CoordLiteral
   */
  center?: naver.maps.Coord | naver.maps.CoordLiteral;
  disableDoubleClickZoom?: boolean;
  disableDoubleTapZoom?: boolean;
  disableKineticPan?: boolean;
  disableTwoFingerTapZoom?: boolean;
  draggable?: boolean;
  keyboardShortcuts?: boolean;
  logoControl?: boolean;
  logoControlOptions?: naver.maps.LogoControlOptions;
  mapDataControl?: boolean;
  mapDataControlOptions?: naver.maps.MapDataControlOptions;
  mapTypeControl?: boolean;
  mapTypeControlOptions?: naver.maps.MapTypeControlOptions;
  mapTypeId?: string;
  mapTypes?: naver.maps.MapTypeRegistry;
  maxBounds?: naver.maps.Bounds | naver.maps.BoundsLiteral | null;
  maxZoom?: number;
  minZoom?: number;
  padding?: MapPaddingOptions;
  pinchZoom?: boolean;
  resizeOrigin?: naver.maps.Position;
  scaleControl?: boolean;
  scaleControlOptions?: naver.maps.ScaleControlOptions;
  scrollWheel?: boolean;
  size?: naver.maps.Size | naver.maps.SizeLiteral;
  overlayZoomEffect?: string | null;
  tileSpare?: number;
  tileTransition?: boolean;
  zoom?: number;
  zoomControl?: boolean;
  zoomControlOptions?: naver.maps.ZoomControlOptions;
  zoomOrigin?: naver.maps.Coord | naver.maps.CoordLiteral | null;
  blankTileImage?: string | null;

  // special.
  centerPoint?: naver.maps.Point | naver.maps.PointLiteral;
};

type Uncontrolled = {
  /**
   * Uncontrolled prop of mapTypeId
   */
  defaultMapTypeId?: MapOptions['mapTypeId'];
  /**
   * Uncontrolled prop of size
   * @type naver.maps.Coord | naver.maps.CoordLiteral
   */
  defaultSize?: MapOptions['size'];
  /**
   * Uncontrolled prop of bounds
   * @type naver.maps.Bounds | naver.maps.BoundsLiteral | null
   */
  defaultBounds?: MapOptions['bounds'];
  /**
   * Uncontrolled prop of center
   * @type naver.maps.Coord | naver.maps.CoordLiteral
   */
  defaultCenter?: MapOptions['center'];
  /**
   * Uncontrolled prop of zoom
   */
  defaultZoom?: MapOptions['zoom'];
  /**
   * Uncontrolled prop of centerPoint
   * @type naver.maps.Point | naver.maps.PointLiteral
   */
  defaultCenterPoint?: MapOptions['centerPoint'];
};

type MapEventCallbacks = {
  onMapTypeIdChanged?: (value: string) => void;
  onMapTypeChanged?: (value: naver.maps.MapType) => void;
  onSizeChanged?: (value: naver.maps.Size) => void;
  onBoundsChanged?: (value: naver.maps.Bounds) => void;
  onCenterChanged?: (value: naver.maps.Coord) => void;
  onCenterPointChanged?: (value: naver.maps.Point) => void;
  onZoomChanged?: (value: number) => void;
};

const basicMapOptionKeys: Array<keyof MapOptions> = [
  'background',
  'baseTileOpacity',
  // 'bounds',
  // 'center',
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
  // 'mapTypeId',
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
  // 'size',
  'overlayZoomEffect',
  'tileSpare',
  'tileTransition',
  // 'zoom',
  'zoomControl',
  'zoomControlOptions',
  'zoomOrigin',
  'blankTileImage',
];

const kvoKeys = [
  'mapTypeId',
  'size',
  'bounds',
  'center',
  'zoom',
  'centerPoint',
] as const;

const kvoEvents = [
  ...kvoKeys.map(key => `${key}_changed`),
  'mapType_changed', // special. https://navermaps.github.io/maps.js.ncp/docs/naver.maps.Map.html#event:mapType_changed__anchor
];
const uiEvents = [
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
  'doubletap',
] as const;
const mapOnlyEvents = [
  'addLayer',
  'idle',
  'init',
  'keydown',
  'keyup',
  'panning',
  'projection_changed',
  'removeLayer',
  'resize',
  'tilesloaded',
  'zooming',
] as const;
const events = [...uiEvents, ...kvoEvents, ...mapOnlyEvents];

// type FunctionTypeChildren = (nmap: naver.maps.Map) => React.ReactNode;

const defaultOptionKeyMap = {
  mapTypeId: 'defaultMapTypeId',
  size: 'defaultSize',
  bounds: 'defaultBounds',
  center: 'defaultCenter',
  zoom: 'defaultZoom',
  centerPoint: 'defaultCenterPoint',
} as const;

export type Props = Uncontrolled & {
  /**
   * Map 관련 components
   */
  children?: ReactNode;
} & MapOptions & MapEventCallbacks;

export const NaverMap = forwardRef<naver.maps.Map | null, Props>(function NaverMap(props, ref) {
  const navermaps = useNavermaps();
  const { element: mapDiv } = useContainerContext();
  const [nmap, setNmap] = useState<naver.maps.Map>();
  const nmapRef = useRef<naver.maps.Map>();

  // https://github.com/facebook/react/issues/20090
  useLayoutEffect(() => {
    if (!mapDiv) {
      throw new Error('react-naver-maps: MapDiv is not found. Did you correctly wrap with `MapDiv`?');
    }

    const basicMapOptions = pick(props, basicMapOptionKeys);
    const kvos = kvoKeys.reduce((acc, key) => {
      // default kvo
      if (props[defaultOptionKeyMap[key]]) {
        return {
          ...acc,
          [key]: props[defaultOptionKeyMap[key]],
        };
      }

      // kvo
      if (props[key]) {
        return {
          ...acc,
          [key]: props[key],
        };
      }

      return acc;
    }, {});

    const _nmap = new navermaps.Map(mapDiv, { ...basicMapOptions, ...kvos });
    setNmap(_nmap);
    // for ref hack
    nmapRef.current = _nmap;

    return () => {
      _nmap.destroy();
    };
  }, []);

  const uncontrolledOmittedProps = (Object.keys(props) as Array<keyof Props>).reduce((acc, key) => {
    // kvo key가 defaultKvo key와 함께 있을 경우 무시한다.
    if (key in defaultOptionKeyMap && props[defaultOptionKeyMap[key as keyof typeof defaultOptionKeyMap]]) {
      return acc;
    }

    return {
      ...acc,
      [key]: props[key],
    };
  }, {}) as Props;

  // nmap 이 layoutEffect에서 생성되므로 항상 Map이 존재한다.
  useImperativeHandle<naver.maps.Map | undefined, naver.maps.Map | undefined>(ref, () => nmapRef.current);

  return (
    <>{nmap && <NaverMapCore {...uncontrolledOmittedProps} nmap={nmap} />}</>
  );
});

function NaverMapCore({ nmap, children, ...mapProps }: Props & { nmap: naver.maps.Map }) {
  const basicMapOptions = pick(mapProps, basicMapOptionKeys);
  const {
    mapTypeId,
    size,
    bounds,
    center,
    centerPoint,
    zoom,
  } = mapProps;

  const prevKVOs = usePrevious({
    mapTypeId,
    size,
    bounds,
    center,
    centerPoint,
    zoom,
  }, [
    mapTypeId,
    size,
    bounds,
    center,
    centerPoint,
    zoom,
  ]);

  function getDirtyKVOs(keys: Array<typeof kvoKeys[number]>): Pick<Props, typeof kvoKeys[number]> {
    return keys.reduce((acc, key) => {
      const currentValue = nmap[`get${upperfirst(key)}` as keyof naver.maps.Map]();
      const propValue = mapProps[key];

      if (!propValue || prevKVOs && prevKVOs[key] === propValue) {
        return acc;
      }

      const isEqual = typeof currentValue.equals === 'function' ? currentValue.equals(propValue) : currentValue === propValue;

      if (isEqual) {
        return acc;
      }

      return {
        ...acc,
        [key]: propValue,
      };
    }, {} as Pick<Props, typeof kvoKeys[number]>);
  }

  useLayoutEffect(() => {
    nmap.setOptions(basicMapOptions);
  }, [Object.values(basicMapOptions)]);

  useLayoutEffect(() => {
    const updated = getDirtyKVOs(['size']).size;
    if (updated) {
      nmap.setSize(updated);
    }
  }, [size]);

  useLayoutEffect(() => {
    const updated = getDirtyKVOs(['mapTypeId']).mapTypeId;
    if (updated) {
      nmap.setMapTypeId(updated);
    }
  }, [mapTypeId]);

  useLayoutEffect(() => {
    const dirties = getDirtyKVOs(['bounds', 'center', 'centerPoint', 'zoom']);

    if (dirties.bounds) {
      // TODO
      nmap.fitBounds(dirties.bounds);

      // Ignore rest kvos
      return;
    }

    if (dirties.center && dirties.zoom) {

      nmap.morph(dirties.center, dirties.zoom);

      // Ignore rest kvos
      return;
    }

    if (dirties.centerPoint) {
      nmap.setCenterPoint(dirties.centerPoint);
    }

    if (dirties.center) {
      // TODO
      nmap.panTo(dirties.center, {});
    }

    if (dirties.zoom) {
      nmap.setZoom(dirties.zoom);
    }
  }, [bounds, center, centerPoint, zoom]);

  return (
    <NaverMapContext.Provider value={nmap}>
      <EventTargetContext.Provider value={nmap}>
        <>
          <HandleEvents
            events={events}
            listeners={mapProps as any}
          />
          {children}
        </>
      </EventTargetContext.Provider>
    </NaverMapContext.Provider>
  );
}
