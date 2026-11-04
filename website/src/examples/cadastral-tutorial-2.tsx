import { useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  CadastralLayer,
  useNavermaps,
} from 'react-naver-maps';
import { ButtonBar, ToggleButton } from './example-ui-a';

function CadastralMapContent() {
  const navermaps = useNavermaps();
  const [cadastral, setCadastral] = useState(true);

  return (
    <>
      <NaverMap
        defaultCenter={{ lat: 37.3595704, lng: 127.105399 }}
        mapTypeControl
        mapTypeControlOptions={{
          style: navermaps.MapTypeControlStyle.DROPDOWN,
        }}
      >
        {cadastral && <CadastralLayer />}
      </NaverMap>
      <ButtonBar>
        <ToggleButton on={cadastral} onClick={() => setCadastral((v) => !v)}>
          {cadastral ? '지적도 끄기' : '지적도 켜기'}
        </ToggleButton>
      </ButtonBar>
    </>
  );
}

export default function CadastralTutorial2Example() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <CadastralMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
