import { useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  useNavermaps,
} from 'react-naver-maps';

const buttonStyle = (active: boolean) => ({
  backgroundColor: active ? '#2780E3' : '#fff',
  color: active ? 'white' : 'black',
  border: 'solid 1px #333',
  outline: '0 none',
  borderRadius: '5px',
  boxShadow: '2px 2px 1px 1px rgba(0, 0, 0, 0.5)',
  fontSize: '16px',
  lineHeight: '1.15',
  padding: '1px 6px',
  margin: '0 5px 5px 0',
  cursor: 'pointer' as const,
});

function MapTypesMap() {
  const navermaps = useNavermaps();
  const [mapTypeId, setMapTypeId] = useState(navermaps.MapTypeId.NORMAL);

  const mapTypes = [
    { id: navermaps.MapTypeId.NORMAL, label: '일반지도' },
    { id: navermaps.MapTypeId.TERRAIN, label: '지형도' },
    { id: navermaps.MapTypeId.SATELLITE, label: '위성지도' },
    { id: navermaps.MapTypeId.HYBRID, label: '겹쳐보기' },
  ];

  return (
    <MapDiv style={{ width: '100%', height: '600px' }}>
      <NaverMap
        defaultCenter={new navermaps.LatLng(37.3595704, 127.105399)}
        defaultZoom={15}
        mapTypeId={mapTypeId}
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
        {mapTypes.map(({ id, label }) => (
          <button
            key={label}
            style={buttonStyle(mapTypeId === id)}
            onClick={() => setMapTypeId(id)}
          >
            {label}
          </button>
        ))}
      </div>
    </MapDiv>
  );
}

export default function MapTypesExample() {
  return (
    <NavermapsProvider ncpClientId="6tdrlcyvpt">
      <MapTypesMap />
    </NavermapsProvider>
  );
}
