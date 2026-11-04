import { useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Polygon,
} from 'react-naver-maps';

const paths = [
  [
    { lat: 37.37544345085402, lng: 127.11224555969238 },
    { lat: 37.37230584065902, lng: 127.10791110992432 },
    { lat: 37.35975408751081, lng: 127.10795402526855 },
    { lat: 37.359924641705476, lng: 127.11576461791992 },
    { lat: 37.35931064479073, lng: 127.12211608886719 },
    { lat: 37.36043630196386, lng: 127.12293148040771 },
    { lat: 37.36354029942161, lng: 127.12310314178465 },
    { lat: 37.365211629488016, lng: 127.12456226348876 },
    { lat: 37.37544345085402, lng: 127.11224555969238 },
  ],
  [
    { lat: 37.368485964153784, lng: 127.10971355438232 },
    { lat: 37.368520071054576, lng: 127.11464881896971 },
    { lat: 37.36350619025713, lng: 127.11473464965819 },
    { lat: 37.363403862670665, lng: 127.1097993850708 },
    { lat: 37.368485964153784, lng: 127.10971355438232 },
  ],
];

function PolygonOptionsMapContent() {
  // 마우스를 올렸는지를 state 로 두고, 그에 따라 선 스타일을 prop 으로 바꾼다.
  const [hover, setHover] = useState(false);

  return (
    <NaverMap
      defaultCenter={{ lat: 37.3674001, lng: 127.1181196 }}
      defaultZoom={14}
    >
      <Polygon
        paths={paths}
        fillColor="#69F4F9"
        fillOpacity={0.3}
        strokeColor={hover ? '#E51D1A' : '#0072FF'}
        strokeOpacity={hover ? 1 : 0.6}
        strokeWeight={3}
        clickable
        onMouseover={() => setHover(true)}
        onMouseout={() => setHover(false)}
      />
    </NaverMap>
  );
}

export default function PolygonOptionsExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '400px' }}>
        <PolygonOptionsMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
