import { useRef, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Polyline,
  useNavermaps,
} from 'react-naver-maps';

const ROUTE_URL =
  'https://navermaps.github.io/maps.js.ncp/docs/data/polyline_route.json';

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  color: '#555',
  border: 'solid 1px #333',
  borderRadius: '5px',
  fontSize: '16px',
  padding: '1px 6px',
  margin: '0 5px 5px 0',
  cursor: 'pointer',
};

type Path = naver.maps.LatLngLiteral[];

// 응답의 path 는 "경도,위도 경도,위도 ..." 문자열이다.
function parsePath(path: string): Path {
  return path.split(' ').map((pair) => {
    const [lng, lat] = pair.split(',').map(parseFloat);
    return { lat, lng };
  });
}

function PolylineRouteMapContent() {
  const navermaps = useNavermaps();
  // 받은 구간(step)별 경로. 한 번 받으면 다시 받지 않는다.
  const stepsRef = useRef<Path[] | null>(null);
  // 지금 그리는 폴리라인들. 단일은 1개, 멀티는 구간 수만큼.
  const [paths, setPaths] = useState<Path[]>([]);

  async function loadSteps() {
    if (!stepsRef.current) {
      const result = await (await fetch(ROUTE_URL)).json();
      const steps: { path?: string }[] = result.routes[0].legs[0].steps;
      stepsRef.current = steps
        .filter((s) => !!s.path)
        .map((s) => parsePath(s.path!));
    }
    return stepsRef.current;
  }

  return (
    <>
      <NaverMap
        defaultCenter={{ lat: 36.3835833, lng: 128.0344242 }}
        defaultZoom={8}
        zoomControl
        zoomControlOptions={{
          style: navermaps.ZoomControlStyle.SMALL,
          position: navermaps.Position.RIGHT_CENTER,
        }}
      >
        {paths.map((path, i) => (
          <Polyline
            key={i}
            path={path}
            strokeColor="#E16E79"
            strokeOpacity={1}
            strokeWeight={3}
          />
        ))}
      </NaverMap>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1000,
          padding: 5,
        }}
      >
        <button
          style={buttonStyle}
          onClick={async () => setPaths([(await loadSteps()).flat()])}
        >
          단일 폴리라인으로 그리기
        </button>
        <button
          style={buttonStyle}
          onClick={async () => setPaths(await loadSteps())}
        >
          멀티 폴리라인으로 그리기
        </button>
        <button style={buttonStyle} onClick={() => setPaths([])}>
          폴리라인 삭제
        </button>
        <span style={{ background: '#fff', padding: '2px 6px' }}>
          폴리라인 {paths.length}개
        </span>
      </div>
    </>
  );
}

export default function PolylineRouteExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px', position: 'relative' }}>
        <PolylineRouteMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
