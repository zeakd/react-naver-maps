import { useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  BicycleLayer,
  useNavermaps,
} from 'react-naver-maps';
import { ButtonBar, ToggleButton } from './example-ui-a';

function BicycleMapContent() {
  const navermaps = useNavermaps();
  // 켜짐 여부는 state로 관리하고 레이어는 마운트와 언마운트로 켜고 끕니다.
  const [bicycle, setBicycle] = useState(true);

  return (
    <>
      <NaverMap
        defaultCenter={{ lat: 37.3595704, lng: 127.105399 }}
        mapTypeControl
        mapTypeControlOptions={{
          style: navermaps.MapTypeControlStyle.DROPDOWN,
        }}
      >
        {bicycle && <BicycleLayer />}
      </NaverMap>
      <ButtonBar>
        <ToggleButton on={bicycle} onClick={() => setBicycle((v) => !v)}>
          자전거
        </ToggleButton>
      </ButtonBar>
    </>
  );
}

export default function BicycleTutorial1Example() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <BicycleMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
