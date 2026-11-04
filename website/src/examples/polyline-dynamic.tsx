import { useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Polyline,
  Marker,
} from 'react-naver-maps';

function PolylineDynamicMapContent() {
  const [points, setPoints] = useState<naver.maps.LatLngLiteral[]>([]);

  return (
    <NaverMap
      defaultCenter={{ lat: 37.3700065, lng: 127.121359 }}
      defaultZoom={14}
      onClick={(e) =>
        setPoints((prev) => [...prev, { lat: e.coord.y, lng: e.coord.x }])
      }
    >
      <Polyline path={points} strokeColor="#5347AA" strokeWeight={2} />
      {points.map((point, i) => (
        <Marker key={i} position={point} />
      ))}
    </NaverMap>
  );
}

export default function PolylineDynamicExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '400px' }}>
        <PolylineDynamicMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
