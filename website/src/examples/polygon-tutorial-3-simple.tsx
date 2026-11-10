import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Polygon,
  Polyline,
} from 'react-naver-maps';

// paths는 고리(ring)의 배열입니다. 첫 고리가 바깥 경계입니다.
const polygonPaths = [
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
];

const polylinePath = [
  { lat: 37.359924641705476, lng: 127.1148204803467 },
  { lat: 37.36343797188166, lng: 127.11486339569092 },
  { lat: 37.368520071054576, lng: 127.11473464965819 },
  { lat: 37.3685882848096, lng: 127.1088123321533 },
  { lat: 37.37295383612657, lng: 127.10876941680907 },
  { lat: 37.38001321351567, lng: 127.11851119995116 },
  { lat: 37.378546827477855, lng: 127.11984157562254 },
  { lat: 37.376637072444105, lng: 127.12052822113036 },
  { lat: 37.37530703574853, lng: 127.12190151214598 },
  { lat: 37.371657839593894, lng: 127.11645126342773 },
  { lat: 37.36855417793982, lng: 127.1207857131958 },
];

function PolygonSimpleMapContent() {
  return (
    <NaverMap
      defaultCenter={{ lat: 37.3674001, lng: 127.1181196 }}
      defaultZoom={14}
    >
      <Polygon
        paths={polygonPaths}
        fillColor="#ff0000"
        fillOpacity={0.3}
        strokeColor="#ff0000"
        strokeOpacity={0.6}
        strokeWeight={3}
      />
      <Polyline path={polylinePath} />
    </NaverMap>
  );
}

export default function PolygonSimpleExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '400px' }}>
        <PolygonSimpleMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
