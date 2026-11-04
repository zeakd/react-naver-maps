import { useRef, useState } from 'react';
import {
  NavermapsProvider,
  Container as PanoDiv,
  Marker,
  useNavermaps,
} from 'react-naver-maps';
import { Panorama } from 'react-naver-maps/panorama';
import { DOCS_URL } from '../samples/remote-data';

const MARKER_POSITION = { lat: 37.359484, lng: 127.105333 };
// 레티나 대응 아이콘: 110x72 원본을 55x36 으로 보인다.
const MARKER_ICON = {
  url: `${DOCS_URL}/img/example/pin_map.png`,
  size: { width: 55, height: 36 },
  anchor: { x: 28, y: 36 },
  origin: { x: 0, y: 0 },
  scaledSize: { width: 55, height: 36 },
};

function PanoramaMarker() {
  const navermaps = useNavermaps();
  const panoRef = useRef<naver.maps.Panorama>(null);
  const [pov, setPov] = useState<naver.maps.PanoramaPov>({
    pan: -135,
    tilt: 29,
    fov: 100,
  });
  const [showMarker, setShowMarker] = useState(true);

  return (
    <>
      <PanoDiv style={{ width: '100%', height: '500px' }}>
        <Panorama
          ref={panoRef}
          position={{ lat: 37.3599605, lng: 127.1058814 }}
          pov={pov}
          // 거리뷰가 준비되면 마커 쪽으로 시야를 돌린다.
          onInit={() => {
            const lookAt = panoRef.current
              ?.getProjection()
              .fromCoordToPov(
                new navermaps.LatLng(MARKER_POSITION.lat, MARKER_POSITION.lng),
              );
            if (lookAt) setPov(lookAt);
          }}
        >
          {showMarker && (
            <Marker
              position={MARKER_POSITION}
              icon={MARKER_ICON}
              onClick={() => alert('marker clicked')}
            />
          )}
        </Panorama>
      </PanoDiv>
      <input
        type="button"
        style={{ marginTop: 8 }}
        value={showMarker ? 'Marker 제거' : 'Marker 추가'}
        onClick={() => setShowMarker((on) => !on)}
      />
    </>
  );
}

export default function PanoramaTutorial4ImageMarkerExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04" submodules={['panorama']}>
      <PanoramaMarker />
    </NavermapsProvider>
  );
}
