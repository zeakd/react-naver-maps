import { useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
} from 'react-naver-maps';
import { FlightSpot } from 'react-naver-maps/panorama';

function FlightSpotMap() {
  const [on, setOn] = useState(true);

  return (
    <MapDiv style={{ width: '100%', height: '600px', position: 'relative' }}>
      <NaverMap
        defaultCenter={{ lat: 37.3595704, lng: 127.105399 }}
        defaultZoom={6}
      >
        {/* 마운트와 언마운트로 켜고 끕니다. */}
        {on && <FlightSpot onPoiClicked={(panoId) => alert(panoId)} />}
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
        <input
          type="button"
          value={on ? '항공뷰 아이콘 제거' : '항공뷰 아이콘 추가'}
          onClick={() => setOn((prev) => !prev)}
        />
      </div>
    </MapDiv>
  );
}

export default function PanoramaTutorial8FlightspotExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04" submodules={['panorama']}>
      <FlightSpotMap />
    </NavermapsProvider>
  );
}
