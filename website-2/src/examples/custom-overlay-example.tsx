import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  CustomOverlay,
  useNavermaps,
} from 'react-naver-maps';

function CustomOverlayMapContent() {
  const navermaps = useNavermaps();

  return (
    <NaverMap
      defaultCenter={new navermaps.LatLng(37.5666805, 126.9784147)}
      defaultZoom={15}
    >
      <CustomOverlay position={{ lat: 37.5666805, lng: 126.9784147 }}>
        <div
          style={{
            background: '#fff',
            border: '2px solid #6366f1',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#1e293b',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transform: 'translate(-50%, -100%)',
          }}
        >
          커스텀 오버레이
        </div>
      </CustomOverlay>
    </NaverMap>
  );
}

function CustomOverlayMap() {
  return (
    <MapDiv style={{ width: '100%', height: '400px' }}>
      <CustomOverlayMapContent />
    </MapDiv>
  );
}

export default function CustomOverlayExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <CustomOverlayMap />
    </NavermapsProvider>
  );
}
