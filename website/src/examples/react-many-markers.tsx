import { useEffect, useMemo, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Marker,
  useMap,
  useListener,
} from 'react-naver-maps';

type View = { south: number; west: number; north: number; east: number };

/** 서울 둘레에 흩어진 점 1000개. 매번 같은 점이 나오게 시드를 고정한다. */
function makePoints(n: number) {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    lat: 37.45 + rand() * 0.25,
    lng: 126.85 + rand() * 0.3,
  }));
}

const dot = {
  content:
    '<div style="width:10px;height:10px;border-radius:50%;background:#0f7f5f;border:2px solid #fff;box-shadow:0 0 2px rgba(0,0,0,.4)"></div>',
  anchor: { x: 7, y: 7 },
};

/** 지도 안에 두는 컴포넌트. 처음 한 번과 지도가 멈출 때마다 보이는 영역을 숫자로 알린다. */
function TrackView({ onChange }: { onChange: (view: View) => void }) {
  const map = useMap();
  const read = () => {
    const bounds = map.getBounds();
    const min = bounds.getMin();
    const max = bounds.getMax();
    onChange({ south: min.y, west: min.x, north: max.y, east: max.x });
  };
  useEffect(read, [map]);
  useListener(map, 'idle', read);
  return null;
}

function ManyMarkersContent() {
  const points = useMemo(() => makePoints(1000), []);
  const [onlyVisible, setOnlyVisible] = useState(true);
  const [view, setView] = useState<View | null>(null);

  // 보이는 영역은 지도가 멈출 때만 바뀐다(움직이는 동안은 다시 렌더하지 않는다).
  const drawn =
    onlyVisible && view
      ? points.filter(
          (p) =>
            p.lat >= view.south &&
            p.lat <= view.north &&
            p.lng >= view.west &&
            p.lng <= view.east,
        )
      : points;

  return (
    <>
      <label style={{ display: 'inline-flex', gap: 6, marginBottom: 10 }}>
        <input
          type="checkbox"
          checked={onlyVisible}
          onChange={(e) => setOnlyVisible(e.target.checked)}
        />
        보이는 영역의 마커만 그리기
      </label>
      <MapDiv style={{ width: '100%', height: '400px' }}>
        <NaverMap
          defaultCenter={{ lat: 37.5666, lng: 126.9784 }}
          defaultZoom={14}
        >
          <TrackView onChange={setView} />
          {drawn.map((p) => (
            <Marker key={p.id} position={p} icon={dot} />
          ))}
        </NaverMap>
      </MapDiv>
      <p style={{ margin: '8px 0 0', fontSize: 14 }}>
        전체 {points.length}개 중 {drawn.length}개를 그리고 있습니다.
      </p>
    </>
  );
}

export default function ManyMarkersExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <ManyMarkersContent />
    </NavermapsProvider>
  );
}
