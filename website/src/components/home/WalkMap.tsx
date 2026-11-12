import { Activity, useRef, useState } from 'react';
import { Container, NaverMap, Marker, InfoWindow } from 'react-naver-maps';

const places = [
  { id: 'cityhall', name: '서울시청', lat: 37.5666, lng: 126.9784 },
  { id: 'deoksu', name: '덕수궁', lat: 37.5658, lng: 126.9751 },
  { id: 'plaza', name: '청계광장', lat: 37.5693, lng: 126.978 },
  { id: 'gwanghwa', name: '광화문', lat: 37.5759, lng: 126.9768 },
  { id: 'gyeongbok', name: '경복궁', lat: 37.5796, lng: 126.977 },
];

export function WalkMap({ height = 420 }: { height?: number }) {
  const map = useRef<naver.maps.Map>(null);
  const [selected, setSelected] = useState('cityhall');
  const [visible, setVisible] = useState(true);
  const place = places.find((p) => p.id === selected)!;

  function select(id: string) {
    const p = places.find((p) => p.id === id)!;
    setSelected(id);
    map.current?.panTo(p);
  }

  return (
    <div className="walk">
      <Container className="walk-map" style={{ height }}>
        <NaverMap ref={map} defaultCenter={places[1]} defaultZoom={15}>
          <Activity mode={visible ? 'visible' : 'hidden'}>
            {places.map((p) => (
              <Marker
                key={p.id}
                position={p}
                title={p.name}
                zIndex={p.id === selected ? 10 : 0}
                onClick={() => select(p.id)}
              />
            ))}
            <InfoWindow
              position={place}
              open
              content={`<div class="walk-info">${place.name}</div>`}
            />
          </Activity>
        </NaverMap>
      </Container>
      <div className="walk-list">
        {places.map((p) => (
          <button
            key={p.id}
            aria-pressed={p.id === selected}
            onClick={() => select(p.id)}
          >
            {p.name}
          </button>
        ))}
        <button className="walk-toggle" onClick={() => setVisible((v) => !v)}>
          {visible ? '마커 숨기기' : '마커 보이기'}
        </button>
      </div>
    </div>
  );
}
