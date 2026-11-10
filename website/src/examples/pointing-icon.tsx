import { useMemo, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Polyline,
  useNavermaps,
} from 'react-naver-maps';

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

function PointingIconMapContent() {
  const navermaps = useNavermaps();
  const [strokeWeight, setStrokeWeight] = useState(6);

  // 공식 예제처럼 기준 두 점에서 동쪽·남쪽으로 옮긴 좌표를 만듭니다.
  const lines = useMemo(() => {
    const upperP1 = new navermaps.LatLng(37.359788198380755, 127.1059799194336);
    const upperP2 = new navermaps.LatLng(37.368861139209535, 127.1059799194336);
    const lowerP1 = upperP1.destinationPoint(180, 1500);
    const lowerP2 = upperP2.destinationPoint(180, 1500);
    const at = (a: naver.maps.LatLng, b: naver.maps.LatLng, east: number) => [
      a.destinationPoint(90, east),
      b.destinationPoint(90, east),
    ];
    const { PointingIcon } = navermaps;
    return [
      // 아이콘 크기를 주지 않으면 strokeWeight에 따라 커집니다.
      { path: at(upperP1, upperP2, 0), endIcon: PointingIcon.OPEN_ARROW },
      { path: at(upperP1, upperP2, 400), endIcon: PointingIcon.BLOCK_ARROW },
      {
        path: at(upperP1, upperP2, 800),
        startIcon: PointingIcon.CIRCLE,
        endIcon: PointingIcon.DIAMOND,
      },
      // 크기(픽셀)를 주면 strokeWeight와 무관합니다. 아이콘에는 투명도가 적용되지 않습니다.
      {
        path: at(lowerP1, lowerP2, 0),
        endIcon: PointingIcon.OPEN_ARROW,
        endIconSize: 20,
      },
      {
        path: at(lowerP1, lowerP2, 400),
        endIcon: PointingIcon.BLOCK_ARROW,
        endIconSize: 40,
      },
      {
        path: at(lowerP1, lowerP2, 800),
        startIcon: PointingIcon.CIRCLE,
        startIconSize: 10,
        endIcon: PointingIcon.DIAMOND,
        endIconSize: 10,
        strokeOpacity: 0.5,
      },
    ];
  }, [navermaps]);

  return (
    <>
      <NaverMap
        defaultCenter={{ lat: 37.3580504, lng: 127.1113383 }}
        defaultZoom={14}
        defaultMapTypeId="normal"
      >
        {lines.map((line, i) => (
          <Polyline
            key={i}
            strokeColor="#ff0000"
            strokeWeight={strokeWeight}
            {...line}
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
          onClick={() => setStrokeWeight((w) => w + 1)}
        >
          선 두께 늘리기
        </button>
        <button
          style={buttonStyle}
          onClick={() => setStrokeWeight((w) => Math.max(1, w - 1))}
        >
          선 두께 줄이기
        </button>
      </div>
    </>
  );
}

export default function PointingIconExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '500px', position: 'relative' }}>
        <PointingIconMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
