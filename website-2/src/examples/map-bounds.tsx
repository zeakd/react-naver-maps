import { useRef, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Rectangle,
  useNavermaps,
} from 'react-naver-maps';

const buttonStyle = {
  backgroundColor: '#fff',
  border: 'solid 1px #333',
  outline: '0 none',
  borderRadius: '5px',
  boxShadow: '2px 2px 1px 1px rgba(0, 0, 0, 0.5)',
  fontSize: '16px',
  lineHeight: '1.15',
  padding: '1px 6px',
  margin: '0 5px 5px 0',
  cursor: 'pointer' as const,
};

function MapBoundsMap() {
  const navermaps = useNavermaps();
  const mapRef = useRef<naver.maps.Map>(null);
  const [bounds, setBounds] = useState<naver.maps.LatLngBounds | null>(null);

  const dokdoBounds = new navermaps.LatLngBounds(
    new navermaps.LatLng(37.2380651, 131.8562652),
    new navermaps.LatLng(37.2444436, 131.8786475),
  );

  return (
    <MapDiv style={{ width: '100%', height: '600px' }}>
      <NaverMap
        ref={mapRef}
        defaultCenter={new navermaps.LatLng(37.5666805, 126.9784147)}
        defaultZoom={10}
        defaultMapTypeId={navermaps.MapTypeId.NORMAL}
        onInit={() => {
          if (mapRef.current)
            setBounds(mapRef.current.getBounds() as naver.maps.LatLngBounds);
        }}
        onBoundsChanged={(newBounds) => {
          window.setTimeout(
            () => setBounds(newBounds as naver.maps.LatLngBounds),
            500,
          );
        }}
      >
        {bounds && (
          <Rectangle
            bounds={bounds}
            strokeOpacity={0}
            strokeWeight={0}
            fillOpacity={0.2}
            fillColor="#f00"
          />
        )}
      </NaverMap>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1000,
          padding: '5px',
        }}
      >
        <button
          style={buttonStyle}
          onClick={() => mapRef.current?.fitBounds(dokdoBounds)}
        >
          독도로 이동하기
        </button>
      </div>
    </MapDiv>
  );
}

export default function MapBoundsExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapBoundsMap />
    </NavermapsProvider>
  );
}
