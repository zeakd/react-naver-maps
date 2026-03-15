import { useRef } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  useNavermaps,
} from 'react-naver-maps';

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  color: '#555',
  border: 'solid 1px #333',
  outline: '0 none',
  borderRadius: '5px',
  boxShadow: '2px 2px 1px 1px rgba(0, 0, 0, 0.5)',
  fontSize: '16px',
  lineHeight: '1.15',
  padding: '1px 6px',
  margin: '0 5px 5px 0',
  cursor: 'pointer',
};

function MapMovesMap() {
  const navermaps = useNavermaps();
  const mapRef = useRef<naver.maps.Map>(null);

  return (
    <MapDiv style={{ width: '100%', height: '600px', position: 'relative' }}>
      <NaverMap
        ref={mapRef}
        defaultCenter={new navermaps.LatLng(37.5666805, 126.9784147)}
        defaultZoom={9}
      />
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
          onClick={() => {
            mapRef.current?.setCenter(
              new navermaps.LatLng(33.3590628, 126.534361),
            );
          }}
        >
          제주도로 setCenter
        </button>
        <button
          style={buttonStyle}
          onClick={() => {
            mapRef.current?.setZoom(6);
          }}
        >
          6레벨로 setZoom
        </button>
        <button
          style={buttonStyle}
          onClick={() => {
            mapRef.current?.fitBounds(
              new navermaps.LatLngBounds(
                new navermaps.LatLng(37.2380651, 131.8562652),
                new navermaps.LatLng(37.2444436, 131.8786475),
              ),
            );
          }}
        >
          독도로 fitBounds
        </button>
        <button
          style={buttonStyle}
          onClick={() => {
            mapRef.current?.panTo(
              new navermaps.LatLng(35.1797865, 129.0750194),
              { duration: 500 },
            );
          }}
        >
          부산으로 panTo
        </button>
        <button
          style={buttonStyle}
          onClick={() => {
            mapRef.current?.panToBounds(
              new navermaps.LatLngBounds(
                new navermaps.LatLng(37.42829747263545, 126.76620435615891),
                new navermaps.LatLng(37.7010174173061, 127.18379493229875),
              ),
            );
          }}
        >
          서울로 panToBounds
        </button>
        <button
          style={buttonStyle}
          onClick={() => {
            mapRef.current?.panBy(new navermaps.Point(10, 10));
          }}
        >
          panBy로 조금씩 이동하기
        </button>
      </div>
    </MapDiv>
  );
}

export default function MapMovesExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapMovesMap />
    </NavermapsProvider>
  );
}
