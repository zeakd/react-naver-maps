import pick from 'lodash.pick';
import React, { useLayoutEffect, useState } from 'react';
import { useMapDiv } from './contexts/map-div';
import { NaverMapContext } from './contexts/naver-map';
import { useNavermaps } from './hooks/use-navermaps';
import upperfirst from 'lodash.upperfirst';
import { usePrevious } from './hooks/use-previous';

type MapPaddingOptions = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

type MapOptions = {
  background?: string;
  baseTileOpacity?: number;
  bounds?: naver.maps.Bounds | naver.maps.BoundsLiteral | null;
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
  'centerPoint',
  'zoom',
] as const;

type Props = {
  children?: React.ReactNode;
  centerPoint?: naver.maps.Point | naver.maps.PointLiteral;
} & MapOptions;

export function NaverMap(props: Props) {
  const navermaps = useNavermaps();
  const mapDiv = useMapDiv();
  const [nmap, setNmap] = useState<naver.maps.Map>();

  // https://github.com/facebook/react/issues/20090
  useLayoutEffect(() => {
    if (!mapDiv) {
      throw new Error('react-naver-maps: MapDiv is not found. Did you correctly wrap with `MapDiv`?');
    }

    const basicMapOptions = pick(props, basicMapOptionKeys);
    const kvos = kvoKeys.reduce((acc, key) => {
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

    return () => {
      _nmap.destroy();
    };
  }, []);

  return (
    <>{nmap && <NaverMapCore {...props} nmap={nmap} />}</>
  );
}

function NaverMapCore({ nmap, children, ...mapOptionProps }: Props & { nmap: naver.maps.Map }) {
  const basicMapOptions = pick(mapOptionProps, basicMapOptionKeys);
  const {
    mapTypeId,
    size,
    bounds,
    center,
    centerPoint,
    zoom,
  } = mapOptionProps;

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
      const propValue = mapOptionProps[key];

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
      nmap.panToBounds(dirties.bounds, {}, {});

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
      {children}
    </NaverMapContext.Provider>
  );
}
