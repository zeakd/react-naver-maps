import { useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Polyline,
} from 'react-naver-maps';

const path = [
  { lat: 37.365620929135716, lng: 127.1036195755005 },
  { lat: 37.365620929135716, lng: 127.11353302001953 },
  { lat: 37.3606921307849, lng: 127.10452079772949 },
  { lat: 37.36821310838941, lng: 127.10814714431763 },
  { lat: 37.360760351656545, lng: 127.11299657821654 },
  { lat: 37.365620929135716, lng: 127.1036195755005 },
];

function PolylineOptionsMapContent() {
  const [hover, setHover] = useState(false);

  return (
    <NaverMap
      defaultCenter={{ lat: 37.3646656, lng: 127.108828 }}
      defaultZoom={16}
    >
      <Polyline
        path={path}
        clickable
        strokeColor={hover ? '#E51D1A' : '#5347AA'}
        strokeStyle={hover ? 'solid' : 'longdash'}
        strokeOpacity={hover ? 1 : 0.5}
        strokeWeight={5}
        onMouseover={() => setHover(true)}
        onMouseout={() => setHover(false)}
      />
    </NaverMap>
  );
}

export default function PolylineOptionsExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '400px' }}>
        <PolylineOptionsMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
