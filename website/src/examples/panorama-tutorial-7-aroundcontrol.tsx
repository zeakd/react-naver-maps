import { useState } from 'react';
import {
  NavermapsProvider,
  Container as PanoDiv,
  useNavermaps,
} from 'react-naver-maps';
import { Panorama } from 'react-naver-maps/panorama';

function PanoramaAroundControl() {
  const navermaps = useNavermaps();
  const [aroundControl, setAroundControl] = useState(true);

  return (
    <>
      <PanoDiv style={{ width: '100%', height: '500px' }}>
        <Panorama
          position={{ lat: 37.3599605, lng: 127.1058814 }}
          pov={{ pan: -135, tilt: 29, fov: 100 }}
          aroundControl={aroundControl}
          aroundControlOptions={{ position: navermaps.Position.TOP_RIGHT }}
        />
      </PanoDiv>
      <input
        type="button"
        style={{ marginTop: 8 }}
        value={aroundControl ? 'AroundControl 끄기' : 'AroundControl 켜기'}
        onClick={() => setAroundControl((on) => !on)}
      />
    </>
  );
}

export default function PanoramaTutorial7AroundcontrolExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04" submodules={['panorama']}>
      <PanoramaAroundControl />
    </NavermapsProvider>
  );
}
