import { useRef, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  StreetLayer,
} from 'react-naver-maps';
import { Panorama } from 'react-naver-maps/panorama';

type LatLng = { lat: number; lng: number };

const buttonStyle = (on: boolean): React.CSSProperties => ({
  backgroundColor: on ? '#2780E3' : '#fff',
  color: on ? 'white' : 'black',
  border: 'solid 1px #333',
  borderRadius: 5,
  boxShadow: '2px 2px 1px 1px rgba(0, 0, 0, 0.5)',
  fontSize: 16,
  padding: '1px 6px',
  cursor: 'pointer',
});

function PanoramaWithMap() {
  const panoRef = useRef<naver.maps.Panorama>(null);
  // 지도와 거리뷰를 state 로 잇는다.
  const [mapCenter, setMapCenter] = useState<LatLng>({
    lat: 37.3599605,
    lng: 127.1058814,
  });
  const [panoPosition, setPanoPosition] = useState<LatLng>(mapCenter);
  const [street, setStreet] = useState(true);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <MapDiv
        style={{ flex: '1 1 320px', height: '500px', position: 'relative' }}
      >
        <NaverMap
          center={mapCenter}
          defaultZoom={17}
          // 거리뷰 레이어가 켜져 있을 때 지도를 누르면 거리뷰를 그 위치로 옮긴다.
          // 거리뷰가 300m 안의 가장 가까운 파노라마를 알아서 고른다.
          onClick={(e) => {
            if (!street) return;
            const coord = e.coord;
            setPanoPosition({ lat: coord.y, lng: coord.x });
          }}
        >
          {street && <StreetLayer />}
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
            style={buttonStyle(street)}
            onClick={() => setStreet((on) => !on)}
          >
            거리뷰
          </button>
        </div>
      </MapDiv>
      <MapDiv style={{ flex: '1 1 320px', height: '500px' }}>
        <Panorama
          ref={panoRef}
          position={panoPosition}
          pov={{ pan: -133, tilt: 0, fov: 100 }}
          // 거리뷰가 바뀌면 지도의 중심을 그 위치로 옮긴다.
          onPanoChanged={() => {
            const latlng = panoRef.current?.getPosition();
            if (latlng) setMapCenter({ lat: latlng.y, lng: latlng.x });
          }}
        />
      </MapDiv>
    </div>
  );
}

export default function PanoramaTutorial9MapExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04" submodules={['panorama']}>
      <PanoramaWithMap />
    </NavermapsProvider>
  );
}
