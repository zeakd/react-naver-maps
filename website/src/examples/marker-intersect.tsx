import { useRef, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Marker,
  CustomOverlay,
  useNavermaps,
} from 'react-naver-maps';

const IMG = 'https://navermaps.github.io/maps.js.ncp/docs/img/example';
const X_OFFSET = 29;
const Y_OFFSET = 50;
// 마커 중심에서 이 픽셀 안에 다른 마커가 있으면 겹친 것으로 봅니다(두 사각형이 만나는 거리의 절반).
const TOLERANCE = 5;

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

// 핀 모양을 따라가는 클릭 영역.
const shape = {
  coords: [
    11, 0, 9, 0, 6, 1, 4, 2, 2, 4, 0, 8, 0, 12, 1, 14, 2, 16, 5, 19, 5, 20, 6,
    23, 8, 26, 9, 30, 9, 34, 13, 34, 13, 30, 14, 26, 16, 23, 17, 20, 17, 19, 20,
    16, 21, 14, 22, 12, 22, 12, 22, 8, 20, 4, 18, 2, 16, 1, 13, 0,
  ],
  type: 'poly',
};

const boxStyle: React.CSSProperties = {
  border: 'solid 1px #333',
  backgroundColor: '#fff',
  padding: 5,
  margin: '0 0 0 5px',
};

type Pt = naver.maps.LatLngLiteral;

function MarkerIntersectMapContent() {
  const navermaps = useNavermaps();
  const mapRef = useRef<naver.maps.Map>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  // 겹친 목록을 연 마커는 마우스가 벗어나도 강조를 유지합니다.
  const [cover, setCover] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ position: Pt; count: number } | null>(
    null,
  );
  const [list, setList] = useState<{ position: Pt; keys: string[] } | null>(
    null,
  );
  const [clicked, setClicked] = useState<string | null>(null);

  // 화면 픽셀로 바꿔 겹친 마커의 key를 구합니다. 줌에 따라 달라지므로 이벤트가 발생할 때 계산합니다.
  const overlappedWith = (key: string) => {
    const projection = mapRef.current!.getProjection();
    const offsetOf = (position: Pt) =>
      projection.fromCoordToOffset(new navermaps.LatLng(position));
    const base = offsetOf(spots.find((s) => s.key === key)!.position);
    return spots
      .filter((s) => {
        const o = offsetOf(s.position);
        return (
          Math.abs(o.x - base.x) <= TOLERANCE * 2 &&
          Math.abs(o.y - base.y) <= TOLERANCE * 2
        );
      })
      .map((s) => s.key)
      .sort((a, b) => (a === key ? -1 : b === key ? 1 : 0));
  };

  const hide = () => {
    setNotice(null);
    setList(null);
    setCover(null);
  };

  return (
    <>
      <NaverMap
        ref={mapRef}
        defaultCenter={{ lat: 37.3595704, lng: 127.105399 }}
        defaultZoom={7}
        // 지도를 누르거나 움직이면(idle) 안내와 목록을 닫습니다.
        onIdle={hide}
        onClick={hide}
      >
        {spots.map((spot) => {
          const highlighted = hovered === spot.key || cover === spot.key;
          return (
            <Marker
              key={spot.key}
              position={spot.position}
              title={spot.key}
              zIndex={highlighted ? 1000 : 100}
              shape={shape}
              icon={{
                url: `${IMG}/${highlighted ? 'sp_pins_spot_v3_over.png' : 'sp_pins_spot_v3.png'}`,
                size: { width: 24, height: 37 },
                anchor: { x: 12, y: 37 },
                origin: spot.origin,
              }}
              onMouseover={() => {
                setHovered(spot.key);
                const keys = overlappedWith(spot.key);
                setNotice(
                  keys.length > 1
                    ? { position: spot.position, count: keys.length }
                    : null,
                );
              }}
              onMouseout={() => {
                setHovered(null);
                setNotice(null);
              }}
              onMousedown={() => {
                const keys = overlappedWith(spot.key);
                if (keys.length <= 1) return;
                setNotice(null);
                setCover(spot.key);
                setList({ position: spot.position, keys });
              }}
              // 겹친 마커는 목록에서 고르도록 마커 자체의 클릭을 무시합니다.
              onClick={() => {
                if (overlappedWith(spot.key).length <= 1) setClicked(spot.key);
              }}
            />
          );
        })}

        {notice && (
          <CustomOverlay position={notice.position}>
            <div style={{ ...boxStyle, width: 180 }}>
              <em style={{ fontWeight: 'bold', color: '#f00' }}>
                {notice.count}
              </em>
              개의 마커가 있습니다.
            </div>
          </CustomOverlay>
        )}
        {list && (
          <CustomOverlay position={list.position}>
            <div style={{ ...boxStyle, width: 200 }}>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {list.keys.map((key, i) => (
                  <li key={key}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setClicked(key);
                        hide();
                      }}
                    >
                      {i + 1}. {key}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </CustomOverlay>
        )}
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
        고른 마커: {clicked ?? '없음'}
      </div>
    </>
  );
}

export default function MarkerIntersectExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '500px', position: 'relative' }}>
        <MarkerIntersectMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
