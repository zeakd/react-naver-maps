import { useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Polygon,
  Marker,
} from 'react-naver-maps';

function PolygonDynamicMapContent() {
  // 클릭한 점을 state 배열에 쌓는다. 폴리곤과 마커는 이 배열에서 그린다.
  const [points, setPoints] = useState<naver.maps.LatLngLiteral[]>([]);

  return (
    <NaverMap
      defaultCenter={{ lat: 37.3674001, lng: 127.1181196 }}
      defaultZoom={14}
      onClick={(e) =>
        setPoints((prev) => [...prev, { lat: e.coord.y, lng: e.coord.x }])
      }
    >
      <Polygon
        paths={[points]}
        fillColor="#ff0000"
        fillOpacity={0.3}
        strokeColor="#ff0000"
        strokeOpacity={0.6}
        strokeWeight={3}
        clickable
      />
      {points.map((point, i) => (
        <Marker key={i} position={point} />
      ))}
    </NaverMap>
  );
}

export default function PolygonDynamicExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '400px' }}>
        <PolygonDynamicMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
