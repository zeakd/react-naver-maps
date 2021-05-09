import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import pick from 'lodash.pick';
import { MapContext } from './contexts/map-context';
import getNavermaps from './utils/get-navermaps';

type padding = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

type MapOption = {
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
  padding?: padding;
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

const mapOptionKeys: Array<keyof MapOption> = [
  'background',
  'baseTileOpacity',
  'bounds',
  'center',
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
  'mapTypeId',
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
  'size',
  'overlayZoomEffect',
  'tileSpare',
  'tileTransition',
  'zoom',
  'zoomControl',
  'zoomControlOptions',
  'zoomOrigin',
  'blankTileImage',
];

const defaultMapOptions: Partial<MapOption> = {
  // background: undefined,
  baseTileOpacity: 1,
  // bounds: null, // NOTE: bounds 를 null로 할경우 에러가 발생한다.
  // center: new navermaps.LatLng(37.5666103, 126.9783882),
  disableDoubleClickZoom: false,
  disableDoubleTapZoom: false,
  disableKineticPan: true,
  disableTwoFingerTapZoom: false,
  draggable: true,
  keyboardShortcuts: false,
  logoControl: true,
  // logoControlOptions: { position: naver.maps.Position.BOTTOM_RIGHT },
  mapDataControl: true,
  // mapDataControlOptions: { position: naver.maps.Position.BOTTOM_LEFT },
  mapTypeControl: false,
  // mapTypeControlOptions: {
  //   mapTypeIds: [
  //     naver.maps.MapTypeId.NORMAL,
  //     naver.maps.MapTypeId.TERRAIN,
  //     naver.maps.MapTypeId.SATELLITE,
  //     naver.maps.MapTypeId.HYBRID,
  //   ],
  //   position: naver.maps.Position.TOP_RIGHT,
  //   style: naver.maps.MapTypeControlStyle.BUTTON,
  //   hideTime: 2000,
  // }, // TODO: navermaps 업데이트에 대비해 generic의 partial 이어야한다..?
  // mapTypeId: naver.maps.MapTypeId.NORMAL,
  // mapTypes: ?,
  // maxBounds: null, // is not null
  // maxZoom: ,
  // minZoom: ,
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  pinchZoom: true,
  // resizeOrigin: naver.maps.Position.CENTER,
  scaleControl: true,
  // scaleControlOptions: { position: naver.maps.Position.BOTTOM_RIGHT },
  scrollWheel: true,
  // size: ?,
  // overlayZoomEffect: null,
  tileSpare: 0,
  tileTransition: true,
  // zoom: 11, // NOTE: zoom의 실제 default는 16이다.
  zoomControl: false,
  // zoomControlOptions: {
  //   position: naver.maps.Position.TOP_LEFT,
  //   style: naver.maps.ZoomControlStyle.LARGE,
  //   legendDisabled: false,
  // },
  // zoomOrigin: null, // NOTE: null이 아님.
  // blankTileImage: null, // NOTE: null이 아님.
};

type Props = {
  id: string;
  elem?: React.ReactElement;
} & MapOption;

const NaverMap: React.FC<Props> = ({
  id,
  children,
  ...restProps
}) => {
  const domRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<naver.maps.Map>();
  const mapRef = useRef<naver.maps.Map>();

  useLayoutEffect(() => {
    const navermaps = getNavermaps();
    if (!domRef.current) {
      throw Error();
    }
    const mapComp = new navermaps.Map(domRef.current);
    // const mapComp = new navermaps.Map(id);

    setMap(mapComp);
    mapRef.current = mapComp;

    return () => {
      mapRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    const mapOptions = pick(restProps, mapOptionKeys);
    mapRef.current?.setOptions({
      ...defaultMapOptions,
      ...mapOptions,
    });
  }, mapOptionKeys.map(key => restProps[key]));

  return (
    <>
      <div
        // id={id}
        ref={domRef}
        style={{
          width: '400px',
          height: '400px',
        }}
      />
      <MapContext.Provider value={map}>
        {children}
      </MapContext.Provider>
    </>
  );
};

export default NaverMap;
