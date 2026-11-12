import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Marker,
} from 'react-naver-maps';

const position = { lat: 37.3595704, lng: 127.105399 };

// 원본 이미지는 50x68입니다. scaledSize로 절반(25x34)으로 줄이면 레티나에서 선명합니다.
const icon = {
  url: 'https://navermaps.github.io/maps.js.ncp/docs/img/example/ico_pin.jpg',
  size: { width: 25, height: 34 },
  scaledSize: { width: 25, height: 34 },
  origin: { x: 0, y: 0 },
  anchor: { x: 12, y: 34 },
};

function MarkerRetinaMapContent() {
  return (
    <NaverMap defaultCenter={position} defaultZoom={15}>
      <Marker position={position} icon={icon} />
    </NaverMap>
  );
}

export default function MarkerRetinaExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '400px' }}>
        <MarkerRetinaMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
