import { useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Marker,
  Rectangle,
} from 'react-naver-maps';

// 독도. 값이 바뀌지 않으니 모듈에 둔다.
const dokdo = {
  south: 37.2380651,
  west: 131.8562652,
  north: 37.2444436,
  east: 131.8786475,
};

function MaxBoundsMapContent() {
  const [zoom, setZoom] = useState(16);

  return (
    <>
      <NaverMap
        // 영역 밖으로 나가지 못하게 maxBounds, 너무 멀어지지 않게 minZoom.
        defaultCenter={{ lat: 37.2412, lng: 131.8674 }}
        defaultZoom={16}
        minZoom={14}
        maxBounds={dokdo}
        onZoomChanged={setZoom}
      >
        <Marker position={{ lat: dokdo.south, lng: dokdo.west }} />
        <Marker position={{ lat: dokdo.north, lng: dokdo.east }} />
        <Rectangle
          bounds={dokdo}
          strokeOpacity={0}
          strokeWeight={0}
          fillOpacity={0.2}
          fillColor="#f00"
        />
      </NaverMap>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1000,
          padding: '5px',
          backgroundColor: '#fff',
          border: 'solid 1px #333',
          fontSize: '14px',
        }}
      >
        zoom:{zoom}
      </div>
    </>
  );
}

export default function MapTutorial8MaxBoundsExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <MaxBoundsMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
