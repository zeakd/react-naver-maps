import { useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Marker,
} from 'react-naver-maps';

const start = { lat: 37.3595704, lng: 127.105399 };

function MarkerPositionMapContent() {
  // 마커 위치를 state로 관리하고 지도를 클릭하면 해당 좌표로 바꿉니다.
  const [position, setPosition] = useState(start);

  return (
    <NaverMap
      defaultCenter={start}
      defaultZoom={15}
      onClick={(e) => setPosition({ lat: e.coord.y, lng: e.coord.x })}
    >
      <Marker position={position} />
    </NaverMap>
  );
}

export default function MarkerPositionExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '400px' }}>
        <MarkerPositionMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
