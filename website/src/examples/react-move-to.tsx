import { useRef, useState, type FormEvent } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Marker,
  useNavermaps,
} from 'react-naver-maps';
import { geocode } from 'react-naver-maps/geocoder';

type Spot = { label: string; lat: number; lng: number };

const presets: Spot[] = [
  { label: '서울시청', lat: 37.5666, lng: 126.9784 },
  { label: '부산역', lat: 35.1151, lng: 129.0414 },
  { label: '제주공항', lat: 33.5104, lng: 126.4913 },
];

const bar: React.CSSProperties = {
  position: 'absolute',
  top: 10,
  left: 10,
  right: 10,
  zIndex: 100,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
};

// Container 안에 있어 useNavermaps() 가 SDK 를 받을 때까지 Container 가 기다려 준다.
function MoveToContent() {
  const navermaps = useNavermaps();
  const map = useRef<naver.maps.Map>(null);
  const [spot, setSpot] = useState<Spot>(presets[0]);
  const [query, setQuery] = useState('불정로 6');
  const [message, setMessage] = useState('');

  function moveTo(next: Spot) {
    setSpot(next);
    map.current?.morph(next, 15);
  }

  async function search(e: FormEvent) {
    e.preventDefault();
    setMessage('찾는 중…');
    try {
      const { addresses } = await geocode(navermaps, { query });
      const first = addresses[0];
      if (!first) return setMessage(`"${query}" 의 주소를 찾지 못했습니다.`);
      moveTo({
        label: first.roadAddress || first.jibunAddress,
        lat: Number(first.y),
        lng: Number(first.x),
      });
      setMessage('');
    } catch {
      setMessage('주소 검색에 실패했습니다.');
    }
  }

  return (
    <>
      <div style={bar}>
        {presets.map((p) => (
          <button key={p.label} onClick={() => moveTo(p)}>
            {p.label}
          </button>
        ))}
        <form
          onSubmit={search}
          style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="주소"
            aria-label="주소"
          />
          <button type="submit">찾기</button>
        </form>
      </div>
      <NaverMap ref={map} defaultCenter={presets[0]} defaultZoom={15}>
        <Marker position={spot} title={spot.label} />
      </NaverMap>
      <p
        style={{
          position: 'absolute',
          left: 10,
          bottom: 10,
          zIndex: 100,
          margin: 0,
          padding: '4px 8px',
          background: '#fff',
          fontSize: 14,
        }}
      >
        {message || spot.label}
      </p>
    </>
  );
}

export default function MoveToExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04" submodules={['geocoder']}>
      <MapDiv style={{ width: '100%', height: '440px' }}>
        <MoveToContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
