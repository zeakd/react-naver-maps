import { useRef, useState } from 'react';
import {
  NavermapsProvider,
  Container as PanoDiv,
  Marker,
  InfoWindow,
  useNavermaps,
} from 'react-naver-maps';
import { Panorama } from 'react-naver-maps/panorama';
import { DOCS_URL } from '../samples/remote-data';

const MARKER_POSITION = { lat: 37.3689782, lng: 127.1059397 };

const CONTENT = `<div style="padding:10px;min-width:200px;line-height:150%;">
  <h3 style="margin:0 0 5px;">서울특별시청</h3>
  <p style="margin:0;">서울특별시 중구 태평로1가 31 | 서울특별시 중구 세종대로 110 서울특별시청<br />
    <img src="${DOCS_URL}/img/example/hi-seoul.jpg" width="55" height="55" alt="서울시청" /><br />
    02-120 | 공공,사회기관 &gt; 특별,광역시청<br />
    <a href="http://www.seoul.go.kr" target="_blank">www.seoul.go.kr/</a>
  </p>
</div>`;

function PanoramaInfoWindow() {
  const navermaps = useNavermaps();
  const panoRef = useRef<naver.maps.Panorama>(null);
  const [pov, setPov] = useState<naver.maps.PanoramaPov>({
    pan: -135,
    tilt: 29,
    fov: 100,
  });
  const [open, setOpen] = useState(false);

  return (
    <PanoDiv style={{ width: '100%', height: '500px' }}>
      <Panorama
        ref={panoRef}
        position={{ lat: 37.3599605, lng: 127.1058814 }}
        pov={pov}
        onInit={() => {
          const lookAt = panoRef.current
            ?.getProjection()
            .fromCoordToPov(
              new navermaps.LatLng(MARKER_POSITION.lat, MARKER_POSITION.lng),
            );
          if (lookAt) setPov(lookAt);
        }}
      >
        <Marker
          position={MARKER_POSITION}
          onClick={() => setOpen((prev) => !prev)}
        />
        <InfoWindow open={open} content={CONTENT} anchor={MARKER_POSITION} />
      </Panorama>
    </PanoDiv>
  );
}

export default function PanoramaTutorial5HtmlInfowindowExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04" submodules={['panorama']}>
      <PanoramaInfoWindow />
    </NavermapsProvider>
  );
}
