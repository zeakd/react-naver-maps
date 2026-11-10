import { useRef, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
} from 'react-naver-maps';

const start = { lat: 37.5666, lng: 126.9784 };

function MultiMapContent() {
  const left = useRef<naver.maps.Map>(null);
  const right = useRef<naver.maps.Map>(null);
  const [linked, setLinked] = useState(true);
  // 사용자가 지금 움직이는 지도. 다른 지도는 이 지도를 따라간다(서로 되돌려 보내지 않도록).
  const leader = useRef<'left' | 'right' | null>(null);

  function follow(from: 'left' | 'right') {
    if (!linked || leader.current !== from) return;
    const src = (from === 'left' ? left : right).current;
    const dst = (from === 'left' ? right : left).current;
    if (src && dst) dst.setCenter(src.getCenter());
  }

  // 오른쪽은 왼쪽보다 3단계 넓게 본다.
  function followZoom(from: 'left' | 'right', zoom: number) {
    if (!linked || leader.current !== from) return;
    const dst = (from === 'left' ? right : left).current;
    dst?.setZoom(from === 'left' ? zoom - 3 : zoom + 3, false);
  }

  return (
    <>
      <label style={{ display: 'inline-flex', gap: 6, marginBottom: 10 }}>
        <input
          type="checkbox"
          checked={linked}
          onChange={(e) => setLinked(e.target.checked)}
        />
        두 지도를 같이 움직이기
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div
          onPointerDown={() => (leader.current = 'left')}
          onWheel={() => (leader.current = 'left')}
        >
          <MapDiv style={{ height: '360px' }}>
            <NaverMap
              ref={left}
              defaultCenter={start}
              defaultZoom={16}
              onCenterChanged={() => follow('left')}
              onZoomChanged={(z) => followZoom('left', z)}
            />
          </MapDiv>
        </div>
        <div
          onPointerDown={() => (leader.current = 'right')}
          onWheel={() => (leader.current = 'right')}
        >
          <MapDiv style={{ height: '360px' }}>
            <NaverMap
              ref={right}
              defaultCenter={start}
              defaultZoom={13}
              mapTypeId="satellite"
              onCenterChanged={() => follow('right')}
              onZoomChanged={(z) => followZoom('right', z)}
            />
          </MapDiv>
        </div>
      </div>
    </>
  );
}

export default function MultiMapExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MultiMapContent />
    </NavermapsProvider>
  );
}
