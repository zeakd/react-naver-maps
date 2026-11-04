import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
} from 'react-naver-maps';

export default function GlTutorial1SimpleExample() {
  return (
    // GL 은 `gl` 서브모듈을 불러오고 NaverMap 에 `gl` 을 준다. 다른 서브모듈과 함께 쓰지 않는다.
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
