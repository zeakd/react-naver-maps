import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Circle,
  useNavermaps,
} from 'react-naver-maps';

function CircleMap() {
  const navermaps = useNavermaps();

  return (
    <MapDiv style={{ width: '100%', height: '400px' }}>
      <NaverMap
        defaultCenter={new navermaps.LatLng(37.5666805, 126.9784147)}
        defaultZoom={14}
      >
        <Circle
          center={new navermaps.LatLng(37.5666805, 126.9784147)}
          radius={500}
          strokeColor="#5347AA"
          strokeWeight={2}
          fillColor="#E4E0FF"
          fillOpacity={0.3}
        />
      </NaverMap>
    </MapDiv>
  );
}

export default function CircleExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <CircleMap />
    </NavermapsProvider>
  );
}
