import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Marker,
  useNavermaps,
} from 'react-naver-maps';

function MarkerMap() {
  const navermaps = useNavermaps();

  return (
    <MapDiv style={{ width: '100%', height: '400px' }}>
      <NaverMap
        defaultCenter={new navermaps.LatLng(37.3595704, 127.105399)}
        defaultZoom={15}
      >
        <Marker position={new navermaps.LatLng(37.3595704, 127.105399)} />
      </NaverMap>
    </MapDiv>
  );
}

export default function MarkerExample() {
  return (
    <NavermapsProvider ncpClientId="6tdrlcyvpt">
      <MarkerMap />
    </NavermapsProvider>
  );
}
