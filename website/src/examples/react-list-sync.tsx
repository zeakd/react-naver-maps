import { useRef, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Marker,
} from 'react-naver-maps';

const places = [
  { id: 'deoksu', name: '덕수궁', kind: '고궁', lat: 37.5658, lng: 126.9751 },
  {
    id: 'cityhall',
    name: '서울시청',
    kind: '관공서',
    lat: 37.5666,
    lng: 126.9784,
  },
  { id: 'plaza', name: '청계광장', kind: '광장', lat: 37.5693, lng: 126.978 },
  { id: 'gwanghwa', name: '광화문', kind: '고궁', lat: 37.5759, lng: 126.9768 },
  { id: 'gyeongbok', name: '경복궁', kind: '고궁', lat: 37.5796, lng: 126.977 },
  { id: 'insadong', name: '인사동', kind: '거리', lat: 37.5741, lng: 126.9849 },
  { id: 'jongmyo', name: '종묘', kind: '고궁', lat: 37.5744, lng: 126.9941 },
];

/** 강조한 장소는 크고 진한 핀으로 그립니다. 같은 값이면 아이콘을 다시 넣지 않습니다. */
function pin(active: boolean) {
  const size = active ? 34 : 24;
  const color = active ? '#0f7f5f' : '#5b636b';
  return {
    content: `<div style="width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
    anchor: { x: size / 2, y: size },
  };
}

function ListSyncContent() {
  const map = useRef<naver.maps.Map>(null);
  const items = useRef<Record<string, HTMLLIElement | null>>({});
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  // 마커를 누르면 목록의 항목을 선택하고 보이도록 스크롤합니다.
  function selectFromMap(id: string) {
    setSelected(id);
    items.current[id]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  // 목록을 누르면 지도를 해당 장소로 옮깁니다.
  function selectFromList(id: string) {
    const p = places.find((p) => p.id === id)!;
    setSelected(id);
    map.current?.panTo(p);
  }

  return (
    <div style={{ display: 'flex', gap: 12, height: 420 }}>
      <ul
        style={{
          width: 180,
          margin: 0,
          padding: 0,
          listStyle: 'none',
          overflowY: 'auto',
        }}
      >
        {places.map((p) => (
          <li
            key={p.id}
            ref={(el) => {
              items.current[p.id] = el;
            }}
            onMouseEnter={() => setHovered(p.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => selectFromList(p.id)}
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              cursor: 'pointer',
              background:
                selected === p.id
                  ? '#e7f6f0'
                  : hovered === p.id
                    ? 'rgba(0,0,0,.05)'
                    : 'transparent',
            }}
          >
            <b>{p.name}</b>
            <div style={{ fontSize: 13, opacity: 0.7 }}>{p.kind}</div>
          </li>
        ))}
      </ul>
      <MapDiv style={{ flex: 1, height: '100%' }}>
        <NaverMap
          ref={map}
          defaultCenter={{ lat: 37.5726, lng: 126.9822 }}
          defaultZoom={14}
        >
          {places.map((p) => {
            const active = p.id === hovered || p.id === selected;
            return (
              <Marker
                key={p.id}
                position={p}
                title={p.name}
                icon={pin(active)}
                zIndex={active ? 10 : 0}
                onClick={() => selectFromMap(p.id)}
                onMouseover={() => setHovered(p.id)}
                onMouseout={() => setHovered(null)}
              />
            );
          })}
        </NaverMap>
      </MapDiv>
    </div>
  );
}

export default function ListSyncExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <ListSyncContent />
    </NavermapsProvider>
  );
}
