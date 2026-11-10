import { Activity, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Marker,
} from 'react-naver-maps';

type Pin = { lat: number; lng: number };
const start = { lat: 37.5666, lng: 126.9784 };

export default function ActivityTabsExample() {
  const [tab, setTab] = useState<'map' | 'list'>('map');
  const [pins, setPins] = useState<Pin[]>([]);

  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <div role="tablist" style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <button
          role="tab"
          aria-selected={tab === 'map'}
          onClick={() => setTab('map')}
        >
          지도
        </button>
        <button
          role="tab"
          aria-selected={tab === 'list'}
          onClick={() => setTab('list')}
        >
          목록 ({pins.length})
        </button>
      </div>
      {/* 숨겨도 지도를 버리지 않는다. 돌아오면 옮긴 위치·줌과 마커가 그대로 있다. */}
      <Activity mode={tab === 'map' ? 'visible' : 'hidden'}>
        <MapDiv style={{ width: '100%', height: '380px' }}>
          <NaverMap
            defaultCenter={start}
            defaultZoom={15}
            onClick={(e) =>
              setPins((prev) => [...prev, { lat: e.coord.y, lng: e.coord.x }])
            }
          >
            {pins.map((p, i) => (
              <Marker key={i} position={p} title={`${i + 1}번`} />
            ))}
          </NaverMap>
        </MapDiv>
        <p style={{ margin: '8px 0 0', fontSize: 14 }}>
          지도를 눌러 마커를 더한 뒤 목록 탭에 다녀와 보세요.
        </p>
      </Activity>
      {tab === 'list' && (
        <ol style={{ minHeight: 380, margin: 0 }}>
          {pins.length === 0 && (
            <li style={{ listStyle: 'none' }}>아직 마커가 없습니다.</li>
          )}
          {pins.map((p, i) => (
            <li key={i}>
              {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
            </li>
          ))}
        </ol>
      )}
    </NavermapsProvider>
  );
}
