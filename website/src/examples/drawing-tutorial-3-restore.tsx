import { useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  GeoJson,
} from 'react-naver-maps';
import { DrawingManager } from 'react-naver-maps/drawing';

const CENTER = { lat: 37.5666103, lng: 126.9783882 };

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  color: '#555',
  border: 'solid 1px #333',
  borderRadius: 5,
  boxShadow: '2px 2px 1px 1px rgba(0, 0, 0, 0.5)',
  fontSize: 16,
  padding: '1px 6px',
  cursor: 'pointer',
};

const rectangleOptions = {
  fillColor: '#ff0000',
  fillOpacity: 0.5,
  strokeWeight: 3,
  strokeColor: '#ff0000',
};
const ellipseOptions = {
  fillColor: '#ff25dc',
  fillOpacity: 0.5,
  strokeWeight: 3,
  strokeColor: '#ff25dc',
};
const polylineOptions = { strokeColor: '#222', strokeWeight: 3 };
const arrowlineOptions = { endIconSize: 16, strokeWeight: 3 };
const polygonOptions = {
  fillColor: '#ffc300',
  fillOpacity: 0.5,
  strokeWeight: 3,
  strokeColor: '#ffc300',
};

function RestoreMaps() {
  const [manager, setManager] =
    useState<naver.maps.drawing.DrawingManager | null>(null);
  const [geojson, setGeojson] = useState<naver.maps.GeoJSON | null>(null);

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <MapDiv style={{ flex: 1, height: '500px', position: 'relative' }}>
        <NaverMap
          defaultCenter={CENTER}
          defaultZoom={15}
          zoomControl
          mapTypeControl
        >
          <DrawingManager
            ref={setManager}
            rectangleOptions={rectangleOptions}
            ellipseOptions={ellipseOptions}
            polylineOptions={polylineOptions}
            arrowlineOptions={arrowlineOptions}
            polygonOptions={polygonOptions}
          />
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
            style={buttonStyle}
            // 그린 도형의 지리 형상을 GeoJSON 으로 뽑아 오른쪽 지도에 올린다.
            onClick={() => manager && setGeojson(manager.toGeoJson())}
          >
            추출 및 복원
          </button>
        </div>
      </MapDiv>
      <MapDiv style={{ flex: 1, height: '500px' }}>
        <NaverMap
          defaultCenter={CENTER}
          defaultZoom={15}
          zoomControl
          mapTypeControl
        >
          {geojson && <GeoJson data={geojson} autoStyle />}
        </NaverMap>
      </MapDiv>
    </div>
  );
}

export default function DrawingTutorial3RestoreExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04" submodules={['drawing']}>
      <RestoreMaps />
    </NavermapsProvider>
  );
}
