import { useMemo, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Marker,
  InfoWindow,
  useNavermaps,
} from 'react-naver-maps';

const cityhall = { lat: 37.5666805, lng: 126.9784147 };

// InfoWindow 의 content 는 SDK 와 같이 HTML 문자열이다.
const content = [
  '<div style="padding:10px;min-width:200px;line-height:150%;">',
  '  <h4 style="margin-top:5px;">서울특별시청</h4>',
  '  <p>서울특별시 중구 태평로1가 31 | 서울특별시 중구 세종대로 110 서울특별시청<br />',
  '    <img src="https://navermaps.github.io/maps.js.ncp/docs/img/example/hi-seoul.jpg" width="55" height="55" alt="서울시청" /><br />',
  '    02-120 | 공공,사회기관 &gt; 특별,광역시청<br />',
  '    <a href="http://www.seoul.go.kr" target="_blank">www.seoul.go.kr/</a>',
  '  </p>',
  '</div>',
].join('');

function InfoWindowSimpleMapContent() {
  const navermaps = useNavermaps();
  // 공식 예제처럼 시청에서 북쪽으로 500m 떨어진 곳을 중심으로 둔다.
  const center = useMemo(
    () => new navermaps.LatLng(cityhall).destinationPoint(0, 500),
    [navermaps],
  );
  // anchor 에는 Marker 인스턴스를 넘긴다. ref 콜백으로 state 에 담는다.
  const [marker, setMarker] = useState<naver.maps.Marker | null>(null);
  const [open, setOpen] = useState(true);

  return (
    <NaverMap defaultCenter={center} defaultZoom={15}>
      <Marker
        ref={setMarker}
        position={cityhall}
        onClick={() => setOpen((prev) => !prev)}
      />
      <InfoWindow
        content={content}
        anchor={marker ?? undefined}
        open={open && marker !== null}
        onClose={() => setOpen(false)}
      />
    </NaverMap>
  );
}

export default function InfoWindowSimpleExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '400px' }}>
        <InfoWindowSimpleMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
