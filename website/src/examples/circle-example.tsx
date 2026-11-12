import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Circle,
} from 'react-naver-maps';

function CircleMapContent() {
  return (
    <NaverMap
      defaultCenter={{ lat: 37.5666805, lng: 126.9784147 }}
      defaultZoom={14}
    >
      <Circle
        center={{ lat: 37.5666805, lng: 126.9784147 }}
        radius={500}
        strokeColor="#5347AA"
        strokeWeight={2}
        fillColor="#E4E0FF"
        fillOpacity={0.3}
      />
    </NaverMap>
  );
}

function CircleMap() {
  return (
    <MapDiv style={{ width: '100%', height: '400px' }}>
      <CircleMapContent />
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
