import { useMemo, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Layer,
  useNavermaps,
} from 'react-naver-maps';
import { ButtonBar, ToggleButton } from './example-ui-a';

function CustomLayerMapContent() {
  const navermaps = useNavermaps();
  const [poi, setPoi] = useState(false);

  // 지도 유형과 레이어 유형 레지스트리는 각각 한 번만 만든다.
  const mapTypes = useMemo(
    () =>
      new navermaps.MapTypeRegistry({
        normal: navermaps.NaverStyleMapTypeOptions.getVectorMap(),
      }),
    [navermaps],
  );
  const labelMapTypes = useMemo(
    () =>
      new navermaps.MapTypeRegistry({
        label: navermaps.NaverStyleMapTypeOptions.getNormalLabelLayer(),
      }),
    [navermaps],
  );

  return (
    <>
      <NaverMap
        defaultCenter={{ lat: 37.3595704, lng: 127.105399 }}
        mapTypes={mapTypes}
      >
        {poi && <Layer name="label" mapTypes={labelMapTypes} />}
      </NaverMap>
      <ButtonBar>
        <ToggleButton on={poi} onClick={() => setPoi((v) => !v)}>
          {poi ? 'POI 끄기' : 'POI 켜기'}
        </ToggleButton>
      </ButtonBar>
    </>
  );
}

export default function CustomTutorial6Example() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <CustomLayerMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
