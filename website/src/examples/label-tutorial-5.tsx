import { useMemo, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  LabelLayer,
  useNavermaps,
} from 'react-naver-maps';
import { ButtonBar, ToggleButton } from './example-ui-a';

function LabelMapContent() {
  const navermaps = useNavermaps();
  const [label, setLabel] = useState(false);

  // 라벨 레이어는 벡터 일반 지도 위에 표시합니다. 레지스트리는 한 번만 만듭니다.
  const mapTypes = useMemo(
    () =>
      new navermaps.MapTypeRegistry({
        normal: navermaps.NaverStyleMapTypeOptions.getVectorMap(),
      }),
    [navermaps],
  );

  return (
    <>
      <NaverMap
        defaultCenter={{ lat: 37.3595704, lng: 127.105399 }}
        mapTypes={mapTypes}
      >
        {label && <LabelLayer />}
      </NaverMap>
      <ButtonBar>
        <ToggleButton on={label} onClick={() => setLabel((v) => !v)}>
          라벨
        </ToggleButton>
      </ButtonBar>
    </>
  );
}

export default function LabelTutorial5Example() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <LabelMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
