import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  GeoJson,
  useMap,
} from 'react-naver-maps';
import { DOCS_URL, useJson } from '../samples/remote-data';

// 렌더마다 참조가 바뀌지 않도록 컴포넌트 밖에 둡니다.
const letterStyle = (feature: naver.maps.Feature) => {
  const color = feature.getProperty('isColorful')
    ? feature.getProperty('color')
    : 'red';
  // icon: null은 점 도형의 기본 마커를 숨깁니다. 타입은 null을 받지 않습니다.
  return {
    fillColor: color,
    strokeColor: color,
    strokeWeight: 2,
    icon: null as unknown as undefined,
  };
};

function Letters() {
  const map = useMap();
  const geojson = useJson<naver.maps.GeoJSON>('data/naver.json');
  if (!geojson) return null;

  return (
    <GeoJson
      data={geojson}
      style={letterStyle}
      // 클릭하면 속성을 바꿔 원래 색으로 칠합니다.
      onClick={(e) => e.feature.setProperty('isColorful', true)}
      onDblclick={(e) => {
        const bounds = e.feature.getBounds();
        if (bounds) map.panToBounds(bounds);
      }}
      // 마우스를 올렸을 때 state 대신 데이터 레이어의 overrideStyle로 강조합니다.
      onMouseover={(e) =>
        map.data.overrideStyle(e.feature, {
          strokeWeight: 8,
          icon: `${DOCS_URL}/img/example/pin_spot.png`,
        })
      }
      onMouseout={() => map.data.revertStyle()}
    />
  );
}

export default function DatalayerTutorial1Example() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <NaverMap
          defaultCenter={{ lat: 37.3586524, lng: 127.1060678 }}
          defaultZoom={18}
        >
          <Letters />
        </NaverMap>
      </MapDiv>
    </NavermapsProvider>
  );
}
