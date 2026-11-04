import { useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Marker,
} from 'react-naver-maps';

const position = { lat: 37.3595704, lng: 127.105399 };

const icon = {
  url: 'https://navermaps.github.io/maps.js.ncp/docs/img/example/pin_default.png',
  size: { width: 22, height: 35 },
  origin: { x: 0, y: 0 },
  anchor: { x: 11, y: 35 },
};

// 핀 모양을 따라가는 다각형. 이미지 안에서 이 영역만 마우스에 반응한다(좌표는 이미지 왼쪽 위 기준).
const shape = {
  coords: [
    11, 0, 9, 0, 6, 1, 4, 2, 2, 4, 0, 8, 0, 12, 1, 14, 2, 16, 5, 19, 5, 20, 6,
    23, 8, 26, 9, 30, 9, 34, 13, 34, 13, 30, 14, 26, 16, 23, 17, 20, 17, 19, 20,
    16, 21, 14, 22, 12, 22, 12, 22, 8, 20, 4, 18, 2, 16, 1, 13, 0,
  ],
  type: 'poly',
};

function MarkerShapeMapContent() {
  const [clicks, setClicks] = useState(0);

  return (
    <>
      <NaverMap defaultCenter={position} defaultZoom={15}>
        <Marker
          position={position}
          icon={icon}
          shape={shape}
          onClick={() => setClicks((n) => n + 1)}
        />
      </NaverMap>
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          zIndex: 1000,
          padding: '4px 8px',
          background: '#fff',
          border: 'solid 1px #333',
          fontSize: 14,
        }}
      >
        핀 모양 안을 눌러 보세요. 마커 클릭 {clicks}회
      </div>
    </>
  );
}

export default function MarkerShapeExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '400px', position: 'relative' }}>
        <MarkerShapeMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
