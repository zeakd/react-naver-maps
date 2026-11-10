import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Marker,
} from 'react-naver-maps';

const ICON_GAP = 31;
const SPRITE_URL =
  'https://navermaps.github.io/maps.js.ncp/docs/img/example/sp_pin_hd.png';

const positions = [
  { lat: 37.3595704, lng: 127.105399 },
  { lat: 37.3618025, lng: 127.1153248 },
  { lat: 37.3561936, lng: 127.0983706 },
];

// 스프라이트 전체 크기를 scaledSize로 줄여 지정하고 origin으로 칸을 자릅니다.
function spriteIcon(index: number) {
  return {
    url: SPRITE_URL,
    size: { width: 26, height: 36 },
    origin: { x: index * ICON_GAP + 1, y: 1 },
    anchor: { x: 13, y: 36 },
    scaledSize: { width: 395, height: 79 },
  };
}

function MarkerRetinaSpriteMapContent() {
  return (
    <NaverMap
      defaultCenter={{ lat: 37.3595704, lng: 127.105399 }}
      defaultZoom={15}
    >
      {positions.map((position, i) => (
        <Marker key={i} position={position} icon={spriteIcon(i)} />
      ))}
    </NaverMap>
  );
}

export default function MarkerRetinaSpriteExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '400px' }}>
        <MarkerRetinaSpriteMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
