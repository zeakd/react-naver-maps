import { useMemo } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  useNavermaps,
} from 'react-naver-maps';

function LanguageMapContent() {
  const navermaps = useNavermaps();

  // 지도 글자(오버레이 타입)를 영어 판으로 바꾼다.
  const mapTypes = useMemo(
    () =>
      new navermaps.MapTypeRegistry({
        normal: navermaps.NaverStyleMapTypeOptions.getNormalMap({
          overlayType: 'ar.bg.ol.sw.len',
        }),
      }),
    [navermaps],
  );

  return (
    <NaverMap
      defaultZoom={16}
      defaultCenter={{ lat: 37.5666103, lng: 126.9783882 }}
      mapTypes={mapTypes}
    />
  );
}

export default function MapTutorial9LanguageExample() {
  return (
    // 스크립트를 불러올 때 언어를 정한다. 한 페이지에서는 처음 불러온 언어가 쓰인다.
    <NavermapsProvider ncpKeyId="aluya4ff04" language="en">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <LanguageMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
