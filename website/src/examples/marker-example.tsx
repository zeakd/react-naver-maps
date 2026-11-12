import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Marker,
} from 'react-naver-maps';

function MarkerMapContent() {
  return (
    <NaverMap
      defaultCenter={{ lat: 37.3595704, lng: 127.105399 }}
      defaultZoom={15}
    >
      <Marker position={{ lat: 37.3595704, lng: 127.105399 }} />
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
