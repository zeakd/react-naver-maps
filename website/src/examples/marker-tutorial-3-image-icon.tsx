import { useMemo } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Marker,
  useNavermaps,
} from 'react-naver-maps';

const center = { lat: 37.3849483, lng: 127.1229117 };
const IMG = 'https://navermaps.github.io/maps.js.ncp/docs/img/example';

function MarkerImageIconMapContent() {
  const navermaps = useNavermaps();
  // 공식 예제처럼 중심에서 동쪽으로 15m 떨어진 곳에 둡니다.
  const position = useMemo(
    () => new navermaps.LatLng(center).destinationPoint(90, 15),
    [navermaps],
  );

  return (
    <NaverMap defaultCenter={center} defaultZoom={19}>
      <Marker
        position={position}
        icon={{
          url: `${IMG}/sally.png`,
          size: { width: 50, height: 52 },
          origin: { x: 0, y: 0 },
          anchor: { x: 25, y: 26 },
        }}
      />
    </NaverMap>
  );
}

export default function MarkerImageIconExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '400px' }}>
        <MarkerImageIconMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
