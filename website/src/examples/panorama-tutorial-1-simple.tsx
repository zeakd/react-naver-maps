import { NavermapsProvider, Container as PanoDiv } from 'react-naver-maps';
import { Panorama } from 'react-naver-maps/panorama';

export default function PanoramaTutorial1SimpleExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04" submodules={['panorama']}>
      <PanoDiv style={{ width: '100%', height: '600px' }}>
        {/* 아이디(panoId)나 좌표(position)로 파노라마를 정합니다. */}
        <Panorama
          position={{ lat: 37.3599605, lng: 127.1058814 }}
          pov={{ pan: -135, tilt: 29, fov: 100 }}
          flightSpot
        />
      </PanoDiv>
    </NavermapsProvider>
  );
}
