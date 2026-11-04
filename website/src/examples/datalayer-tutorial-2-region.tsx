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

const regionStyle = (feature: naver.maps.Feature) => {
  const focus = feature.getProperty('focus');
  return {
    fillColor: focus ? '#0f0' : '#ff0000',
    fillOpacity: focus ? 0.6 : 0.0001,
    strokeColor: focus ? '#0f0' : '#ff0000',
    strokeWeight: focus ? 4 : 2,
    strokeOpacity: focus ? 1 : 0.4,
  };
};

type Tooltip = { x: number; y: number; text: string };

function Regions({
  onTooltip,
}: {
  onTooltip: (tooltip: Tooltip | null) => void;
}) {
  const map = useMap();
  const files = useJsonAll<naver.maps.GeoJSON & { features: unknown[] }>(
    REGION_PATHS,
  );
  // 17개 파일의 feature 를 한 FeatureCollection 으로 합친다.
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
      style={regionStyle}
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
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px', position: 'relative' }}>
        <NaverMap
          defaultCenter={{ lat: 36.4203004, lng: 128.31796 }}
          defaultZoom={7}
        >
          <Regions onTooltip={setTooltip} />
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
    </NavermapsProvider>
  );
}
