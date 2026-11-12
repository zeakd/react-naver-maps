import { useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Marker,
  InfoWindow,
} from 'react-naver-maps';

const cityhall = { lat: 37.5666805, lng: 126.9784147 };

const content = [
  '<div style="padding:5px;line-height:150%;">',
  '  <h4 style="margin-top:5px;">서울특별시청</h4>',
  '  <p>서울특별시 중구 태평로1가 31 | 서울특별시 중구 세종대로 110 서울특별시청<br />',
  '    <img src="https://navermaps.github.io/maps.js.ncp/docs/img/example/hi-seoul.jpg" width="55" height="55" alt="서울시청" /><br />',
  '    02-120 | 공공,사회기관 &gt; 특별,광역시청<br />',
  '    <a href="http://www.seoul.go.kr" target="_blank">www.seoul.go.kr/</a>',
  '  </p>',
  '</div>',
].join('');

function InfoWindowOptionsMapContent() {
  const [marker, setMarker] = useState<naver.maps.Marker | null>(null);
  // 공식 예제는 처음에 닫혀 있고 마커를 누르면 열고 닫습니다.
  const [open, setOpen] = useState(false);

  return (
    <NaverMap defaultCenter={cityhall} defaultZoom={15}>
      <Marker
        ref={setMarker}
        position={cityhall}
        onClick={() => setOpen((prev) => !prev)}
      />
      <InfoWindow
        content={content}
        anchor={marker ?? undefined}
        open={open && marker !== null}
        maxWidth={140}
        backgroundColor="#eee"
        borderColor="#2db400"
        borderWidth={5}
        anchorSize={{ width: 30, height: 30 }}
        anchorSkew
        anchorColor="#eee"
        pixelOffset={{ x: 20, y: -20 }}
        onClose={() => setOpen(false)}
      />
    </NaverMap>
  );
}

export default function InfoWindowOptionsExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '400px' }}>
        <InfoWindowOptionsMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
