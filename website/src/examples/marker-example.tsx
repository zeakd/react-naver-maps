import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Marker,
  useNavermaps,
} from 'react-naver-maps';

function MarkerMapContent() {
  const navermaps = useNavermaps();

  return (
    <NaverMap
      defaultCenter={new navermaps.LatLng(37.3595704, 127.105399)}
      defaultZoom={15}
    >
      <Marker position={new navermaps.LatLng(37.3595704, 127.105399)} />
    </NaverMap>
  );
}

function MarkerMap() {
  return (
    <MapDiv style={{ width: '100%', height: '400px' }}>
      <MarkerMapContent />
    </MapDiv>
  );
}

export default function MarkerExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MarkerMap />
    </NavermapsProvider>
  );
}
