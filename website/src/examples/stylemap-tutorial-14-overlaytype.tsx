import { useMemo } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  useNavermaps,
} from 'react-naver-maps';

function OverlayTypeMapContent() {
  const navermaps = useNavermaps();

  // 레지스트리는 한 번만 만듭니다. 렌더마다 새로 만들면 지도 유형이 매번 바뀝니다.
  const mapTypes = useMemo(
    () =>
      new navermaps.MapTypeRegistry({
        normal: navermaps.NaverStyleMapTypeOptions.getNormalMap({
          overlayType: 'bg.ol.ts.ctt.lko',
        }),
      }),
    [navermaps],
  );

  return <NaverMap defaultZoom={11} mapTypes={mapTypes} />;
}

export default function StyleMapTutorial14OverlayTypeExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <OverlayTypeMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
