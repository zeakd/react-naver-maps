import { useState } from 'react';
import {
  NavermapsProvider,
  Container as PanoDiv,
  useNavermaps,
} from 'react-naver-maps';
import { Panorama } from 'react-naver-maps/panorama';

function PanoramaZoomControl() {
  const navermaps = useNavermaps();
  const [zoomControl, setZoomControl] = useState(true);
  const [large, setLarge] = useState(false);

  return (
    <>
      <PanoDiv style={{ width: '100%', height: '500px' }}>
        <Panorama
          position={{ lat: 37.3599605, lng: 127.1058814 }}
          pov={{ pan: -135, tilt: 29, fov: 100 }}
          zoomControl={zoomControl}
          zoomControlOptions={{
            position: navermaps.Position.TOP_RIGHT,
            style: large
              ? navermaps.ZoomControlStyle.LARGE
              : navermaps.ZoomControlStyle.SMALL,
          }}
        />
      </PanoDiv>
      <div style={{ marginTop: 8 }}>
        <input
          type="button"
          style={{ marginRight: 8 }}
          value={zoomControl ? 'ZoomControl 끄기' : 'ZoomControl 켜기'}
          onClick={() => setZoomControl((on) => !on)}
        />
        <input
          type="button"
          disabled={!zoomControl}
          value={large ? '작게 보기' : '크게 보기'}
          onClick={() => setLarge((on) => !on)}
        />
      </div>
    </>
  );
}

export default function PanoramaTutorial6ZoomcontrolExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04" submodules={['panorama']}>
      <PanoramaZoomControl />
    </NavermapsProvider>
  );
}
