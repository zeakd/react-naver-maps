import { useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Marker,
  InfoWindow,
  useNavermaps,
} from 'react-naver-maps';

function InfoWindowMapContent() {
  const navermaps = useNavermaps();
  const [open, setOpen] = useState(true);

  return (
    <NaverMap
      defaultCenter={new navermaps.LatLng(37.5666805, 126.9784147)}
      defaultZoom={15}
    >
      <Marker
        position={new navermaps.LatLng(37.5666805, 126.9784147)}
        onClick={() => setOpen((prev) => !prev)}
      />
      {open && (
        <InfoWindow
          content="서울시청"
          position={new navermaps.LatLng(37.5666805, 126.9784147)}
          onClose={() => setOpen(false)}
        />
      )}
    </NaverMap>
  );
}

function InfoWindowMap() {
  return (
    <MapDiv style={{ width: '100%', height: '400px' }}>
      <InfoWindowMapContent />
    </MapDiv>
  );
}

export default function InfoWindowExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <InfoWindowMap />
    </NavermapsProvider>
  );
}
