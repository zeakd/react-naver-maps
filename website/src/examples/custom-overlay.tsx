import { useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  CustomOverlay,
} from 'react-naver-maps';

const IMG = 'https://navermaps.github.io/maps.js.ncp/docs/img/example';
const start = { lat: 37.3849483, lng: 127.1229117 };

// 오버레이 안은 평범한 React 요소다.
function BrownCard() {
  return (
    <div
      style={{
        width: 124,
        backgroundColor: '#F2F0EA',
        textAlign: 'center',
        border: '2px solid #6C483B',
      }}
    >
      <img
        src={`${IMG}/brown.png`}
        alt="Brown"
        style={{ width: 120, height: 130 }}
      />
      <span style={{ fontWeight: 'bold' }}> Brown </span>
    </div>
  );
}

function CustomOverlayMapContent() {
  // 클릭한 위치마다 오버레이를 하나씩 더한다. 처음에는 중심에 하나가 있다.
  const [positions, setPositions] = useState([start]);

  return (
    <NaverMap
      defaultCenter={start}
      defaultZoom={19}
      onClick={(e) =>
        setPositions((prev) => [...prev, { lat: e.coord.y, lng: e.coord.x }])
      }
    >
      {positions.map((position, i) => (
        <CustomOverlay key={i} position={position} pane="overlayLayer">
          <BrownCard />
        </CustomOverlay>
      ))}
    </NaverMap>
  );
}

export default function CustomOverlayExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '400px' }}>
        <CustomOverlayMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
