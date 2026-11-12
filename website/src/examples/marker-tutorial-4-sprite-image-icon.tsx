import { useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Marker,
} from 'react-naver-maps';

const IMG = 'https://navermaps.github.io/maps.js.ncp/docs/img/example';

const positions = [
  { lat: 37.3633324, lng: 129.1054988 },
  { lat: 37.3632916, lng: 129.1085015 },
  { lat: 37.3632507, lng: 129.1115043 },
  { lat: 37.3632097, lng: 129.114507 },
  { lat: 37.3631687, lng: 129.1175097 },
  { lat: 37.3597282, lng: 129.105422 },
  { lat: 37.3596874, lng: 129.1084246 },
  { lat: 37.3596465, lng: 129.1114272 },
  { lat: 37.3596056, lng: 129.1144298 },
  { lat: 37.3595646, lng: 129.1174323 },
];

// 스프라이트 이미지의 i번째 칸을 사용합니다. 마우스를 올리면 아래 줄(over 이미지)로 바꿉니다.
function spriteIcon(i: number, hover: boolean) {
  return {
    url: `${IMG}/${hover ? 'sp_pins_spot_v3_over.png' : 'sp_pins_spot_v3.png'}`,
    size: { width: 24, height: 37 },
    anchor: { x: 12, y: 37 },
    origin: { x: i * 29, y: hover ? 50 : 0 },
  };
}

function MarkerSpriteMapContent() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <NaverMap
      defaultCenter={{ lat: 37.3614483, lng: 129.1114883 }}
      defaultZoom={16}
    >
      {positions.map((position, i) => (
        <Marker
          key={i}
          position={position}
          icon={spriteIcon(i, hovered === i)}
          onMouseover={() => setHovered(i)}
          onMouseout={() => setHovered(null)}
        />
      ))}
    </NaverMap>
  );
}

export default function MarkerSpriteImageIconExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '400px' }}>
        <MarkerSpriteMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
