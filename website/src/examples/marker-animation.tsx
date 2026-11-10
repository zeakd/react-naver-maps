import { useMemo, useRef, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Marker,
  useNavermaps,
} from 'react-naver-maps';

const IMG = 'https://navermaps.github.io/maps.js.ncp/docs/img/example';

const symbolPath = [
  { x: 0, y: 70 },
  { x: 20, y: 100 },
  { x: 40, y: 70 },
  { x: 30, y: 70 },
  { x: 70, y: 0 },
  { x: 10, y: 70 },
];

const symbolShape = {
  coords: [0, 70, 20, 100, 40, 70, 30, 70, 70, 0, 10, 70],
  type: 'poly',
};

const htmlIcon = {
  content: [
    '<div style="position:absolute;width:20px;height:20px;">',
    `<span style="position:absolute;width:38px;height:58px;background:url(${IMG}/sp_mapbridge5.png) no-repeat -220px -45px;background-size:400px 450px;z-index:10;"></span>`,
    '</div>',
  ].join(''),
  size: { width: 38, height: 58 },
  anchor: { x: 19, y: 58 },
};

function MarkerAnimationMapContent() {
  const navermaps = useNavermaps();
  const symbolIcon = useMemo(
    () => ({
      path: symbolPath,
      style: navermaps.SymbolStyle.CLOSED_PATH,
      anchor: { x: 23, y: 103 },
      fillColor: '#ff0000',
      fillOpacity: 1,
      strokeColor: '#000000',
      strokeStyle: 'solid' as const,
      strokeWeight: 3,
    }),
    [navermaps],
  );
  const urlMarkerRef = useRef<naver.maps.Marker>(null);
  // animation은 값이 바뀔 때만 SDK에 적용됩니다. DROP이 끝나면 SDK가 null로 바꿉니다.
  const [urlAnimation, setUrlAnimation] = useState<naver.maps.Animation | null>(
    navermaps.Animation.DROP,
  );

  return (
    <NaverMap
      defaultBounds={{
        south: 37.3542795,
        west: 127.1051714,
        north: 37.372462,
        east: 127.1174332,
      }}
    >
      <Marker
        ref={urlMarkerRef}
        position={{ lat: 37.3542795, lng: 127.1072556 }}
        title="urlMarker"
        icon={`${IMG}/pin_default.png`}
        animation={urlAnimation}
        onClick={() =>
          // SDK의 현재 애니메이션 상태를 보고 켜고 끕니다.
          setUrlAnimation(
            urlMarkerRef.current?.getAnimation() != null
              ? null
              : navermaps.Animation.BOUNCE,
          )
        }
      />
      <Marker
        position={{ lat: 37.363777, lng: 127.1174332 }}
        title="imageMarker"
        icon={`${IMG}/pin_default.png`}
        animation={navermaps.Animation.BOUNCE}
      />
      <Marker
        position={{ lat: 37.3692417, lng: 127.113474 }}
        title="symbolMarker"
        icon={symbolIcon}
        shape={symbolShape}
        animation={navermaps.Animation.BOUNCE}
      />
      <Marker
        position={{ lat: 37.3578575, lng: 127.1063746 }}
        title="htmlMarker"
        icon={htmlIcon}
        animation={navermaps.Animation.BOUNCE}
      />
    </NaverMap>
  );
}

export default function MarkerAnimationExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '400px' }}>
        <MarkerAnimationMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
