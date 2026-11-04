import { useRef, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Marker,
} from 'react-naver-maps';

const IMG = 'https://navermaps.github.io/maps.js.ncp/docs/img/example';
const X_OFFSET = 29;
const Y_OFFSET = 50;

// 스프라이트 이미지의 칸(A0 ~ I2)마다 마커 하나. 위치는 처음 지도 영역 안에서 흩뿌린다(고정 값).
const spots = Array.from({ length: 27 }, (_, n) => {
  const col = n % 9;
  const row = Math.floor(n / 9);
  const rand = (seed: number) => {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };
  return {
    key: `${'ABCDEFGHI'[col]}${row}`,
    position: {
      lat: 37.2 + 0.32 * rand(n + 1),
      lng: 126.83 + 0.55 * rand(n + 101),
    },
    origin: { x: col * X_OFFSET, y: row * Y_OFFSET },
  };
});

function MarkerViewportMapContent() {
  const mapRef = useRef<naver.maps.Map>(null);
  // 지도가 멈출 때(idle) 보이는 영역을 읽어 두고, 그 안의 마커만 그린다.
  const [bounds, setBounds] = useState<naver.maps.LatLngBounds | null>(null);

  const visible = bounds
    ? spots.filter((spot) => bounds.hasLatLng(spot.position))
    : spots;

  return (
    <>
      <NaverMap
        ref={mapRef}
        defaultCenter={{ lat: 37.3595704, lng: 127.105399 }}
        defaultZoom={10}
        onIdle={() =>
          setBounds(mapRef.current?.getBounds() as naver.maps.LatLngBounds)
        }
      >
        {visible.map((spot) => (
          <Marker
            key={spot.key}
            position={spot.position}
            title={spot.key}
            zIndex={100}
            icon={{
              url: `${IMG}/sp_pins_spot_v3.png`,
              size: { width: 24, height: 37 },
              anchor: { x: 12, y: 37 },
              origin: spot.origin,
            }}
          />
        ))}
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
        지도에 그린 마커 {visible.length} / {spots.length}
      </div>
    </>
  );
}

export default function MarkerViewportExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '400px', position: 'relative' }}>
        <MarkerViewportMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
