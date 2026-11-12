import { useMemo } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Marker,
  useNavermaps,
} from 'react-naver-maps';

const position = { lat: 37.3595704, lng: 127.105399 };

// SymbolIcon은 좌표 배열(path)로 모양을 그립니다. style은 SDK 상수라 useNavermaps()로 받습니다.
const symbolPath = [
  { x: 0, y: 70 },
  { x: 20, y: 100 },
  { x: 40, y: 70 },
  { x: 30, y: 70 },
  { x: 70, y: 0 },
  { x: 10, y: 70 },
];

function MarkerSymbolIconMapContent() {
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
  return (
    <NaverMap defaultCenter={position} defaultZoom={15}>
      <Marker position={position} icon={symbolIcon} />
    </NaverMap>
  );
}

export default function MarkerSymbolIconExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '400px' }}>
        <MarkerSymbolIconMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
