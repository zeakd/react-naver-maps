import { useMemo, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  GeoJson,
  useMap,
} from 'react-naver-maps';
import { useJsonAll } from '../samples/remote-data';

const REGION_PATHS = Array.from(
  { length: 17 },
  (_, i) => `data/region${String(i + 1).padStart(2, '0')}.json`,
);

// 색마다 style 함수를 컴포넌트 밖에 둡니다. 렌더마다 새 함수를 만들면 매번 다시 칠합니다.
const makeRegionStyle = (color: string) => (feature: naver.maps.Feature) => {
  const focus = feature.getProperty('focus');
  return {
    fillColor: focus ? '#0f0' : color,
    fillOpacity: focus ? 0.6 : 0.0001,
    strokeColor: focus ? '#0f0' : color,
    strokeWeight: focus ? 4 : 2,
    strokeOpacity: focus ? 1 : 0.4,
  };
};
const regionStyles = {
  red: makeRegionStyle('#ff0000'),
  blue: makeRegionStyle('#0050ff'),
};
type RegionColor = keyof typeof regionStyles;

type Tooltip = { x: number; y: number; text: string };

function Regions({
  color,
  onTooltip,
}: {
  color: RegionColor;
  onTooltip: (tooltip: Tooltip | null) => void;
}) {
  const map = useMap();
  const files = useJsonAll<naver.maps.GeoJSON & { features: unknown[] }>(
    REGION_PATHS,
  );
  // 17개 파일의 feature를 한 FeatureCollection으로 합칩니다.
  const regions = useMemo(
    () =>
      files && {
        type: 'FeatureCollection' as const,
        features: files.flatMap((f) => f.features),
      },
    [files],
  );
  if (!regions) return null;

  return (
    <GeoJson
      data={regions as unknown as naver.maps.GeoJSON}
      style={regionStyles[color]}
      onClick={(e) =>
        e.feature.setProperty('focus', !e.feature.getProperty('focus'))
      }
      onMouseover={(e) => {
        onTooltip({
          x: e.offset.x,
          y: e.offset.y,
          text: e.feature.getProperty('area1'),
        });
        map.data.overrideStyle(e.feature, {
          fillOpacity: 0.6,
          strokeWeight: 4,
          strokeOpacity: 1,
        });
      }}
      onMouseout={() => {
        onTooltip(null);
        map.data.revertStyle();
      }}
    />
  );
}

export default function DatalayerTutorial2RegionExample() {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [color, setColor] = useState<RegionColor>('red');
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px', position: 'relative' }}>
        <NaverMap
          defaultCenter={{ lat: 36.4203004, lng: 128.31796 }}
          defaultZoom={7}
        >
          <Regions color={color} onTooltip={setTooltip} />
        </NaverMap>
        {tooltip && (
          <div
            style={{
              position: 'absolute',
              zIndex: 1000,
              left: tooltip.x,
              top: tooltip.y,
              padding: '5px 10px',
              backgroundColor: '#fff',
              border: 'solid 2px #000',
              fontSize: '14px',
              pointerEvents: 'none',
            }}
          >
            {tooltip.text}
          </div>
        )}
      </MapDiv>
      <button onClick={() => setColor((c) => (c === 'red' ? 'blue' : 'red'))}>
        경계선 색 바꾸기
      </button>
    </NavermapsProvider>
  );
}
