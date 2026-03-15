import { useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Marker,
  InfoWindow,
  useNavermaps,
} from 'react-naver-maps';

function InfoWindowMap() {
  const navermaps = useNavermaps();
  const [open, setOpen] = useState(true);

  return (
    <MapDiv style={{ width: '100%', height: '400px' }}>
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
    </MapDiv>
  );
}

export default function InfoWindowExample() {
  return (
    <NavermapsProvider ncpClientId="6tdrlcyvpt">
      <InfoWindowMap />
    </NavermapsProvider>
  );
}
