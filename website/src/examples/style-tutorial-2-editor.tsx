import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
} from 'react-naver-maps';

export default function StyleTutorial2EditorExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04" submodules={['gl']}>
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <NaverMap
          gl
          defaultCenter={{ lat: 37.5666103, lng: 126.9783882 }}
          defaultZoom={15}
          // Style Editor 에서 발행한 My Style ID. 생성 때만 적용된다.
          customStyleId="aedf4962-5d0b-44b7-8bc8-08c84cee0546"
        />
      </MapDiv>
    </NavermapsProvider>
  );
}
