import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
} from 'react-naver-maps';

export default function GlTutorial1SimpleExample() {
  return (
    // GL은 `gl` 서브모듈을 불러오고 NaverMap에 `gl`을 줍니다. 다른 서브모듈과 함께 쓰지 않습니다.
    <NavermapsProvider ncpKeyId="aluya4ff04" submodules={['gl']}>
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <NaverMap
          gl
          defaultCenter={{ lat: 37.3595704, lng: 127.105399 }}
          defaultZoom={15}
        />
      </MapDiv>
    </NavermapsProvider>
  );
}
