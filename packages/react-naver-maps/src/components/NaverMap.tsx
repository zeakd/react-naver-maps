import pick from 'lodash.pick';
import React, { useEffect } from 'react';
import { MapContext, useMapContext } from '../contexts/map-context';

const optionKeys = [
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
] as const;

type CoreProps = naver.maps.MapOptions & {
  // TODO: fix DefinitelyTyped
  blankTileImage?: string | null;
} & {
  map: naver.maps.Map;
  children: React.ReactNode;
};

function NaverMapCore({
  map,
  children,
  ...restProps
}: CoreProps) {
  useEffect(() => {
    const options = pick(restProps, optionKeys);
    map.setOptions(options);
  }, optionKeys.map(key => restProps[key]));

  return (
    <MapContext.Provider value={map}>
      {children}
    </MapContext.Provider>
  );
}


type Props = CoreProps & {
  map?: naver.maps.Map;
};

function NaverMap(props: Props): React.ReactElement | null {
  const { map: mapFromProps, ...restProps } = props;

  const mapFromParent = useMapContext();
  const map = mapFromParent || mapFromProps;

  return (
    map ? <NaverMapCore map={map} {...restProps}></NaverMapCore> : null
  );
}

export default NaverMap;
