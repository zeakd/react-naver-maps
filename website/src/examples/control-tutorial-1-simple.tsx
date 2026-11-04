import { useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
} from 'react-naver-maps';
import { ButtonBar, ToggleButton } from './example-ui-a';

function ControlMapContent() {
  const [zoomControl, setZoomControl] = useState(true);
  const [scaleControl, setScaleControl] = useState(false);
  const [mapDataControl, setMapDataControl] = useState(false);

  return (
    <>
      <NaverMap
        // logoControl={false} 는 SDK 가 거부한다(로고는 항상 보인다). 위치만 바꿀 수 있다.
        logoControl={false}
        scaleControl={scaleControl}
        mapDataControl={mapDataControl}
        zoomControl={zoomControl}
        minZoom={6}
      />
      <ButtonBar>
        <ToggleButton
          on={zoomControl}
          onClick={() => setZoomControl((v) => !v)}
        >
          줌 컨트롤
        </ToggleButton>
        <ToggleButton
          on={scaleControl}
          onClick={() => setScaleControl((v) => !v)}
        >
          축척 컨트롤
        </ToggleButton>
        <ToggleButton
          on={mapDataControl}
          onClick={() => setMapDataControl((v) => !v)}
        >
          저작권 컨트롤
        </ToggleButton>
      </ButtonBar>
    </>
  );
}

export default function ControlTutorial1SimpleExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <ControlMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
