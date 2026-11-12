import { useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  StreetLayer,
  useNavermaps,
} from 'react-naver-maps';
import { ButtonBar, ToggleButton } from './example-ui-a';

function StreetMapContent() {
  const navermaps = useNavermaps();
  const [street, setStreet] = useState(true);

  return (
    <>
      <NaverMap
        defaultCenter={{ lat: 37.3595704, lng: 127.105399 }}
        mapTypeControl
        mapTypeControlOptions={{
          style: navermaps.MapTypeControlStyle.DROPDOWN,
        }}
      >
        {street && <StreetLayer />}
      </NaverMap>
      <ButtonBar>
        <ToggleButton on={street} onClick={() => setStreet((v) => !v)}>
          거리뷰
        </ToggleButton>
      </ButtonBar>
    </>
  );
}

export default function StreetTutorial4Example() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <StreetMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
