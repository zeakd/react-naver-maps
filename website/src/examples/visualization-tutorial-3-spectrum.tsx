import { useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  useNavermaps,
} from 'react-naver-maps';
import { HeatMap } from 'react-naver-maps/visualization';
import { useJson } from '../samples/remote-data';

type Earthquakes = {
  coordinates: React.ComponentProps<typeof HeatMap>['data'];
};

function EarthquakeHeatMap({
  colorMap,
  inReverse,
}: {
  colorMap: naver.maps.visualization.SpectrumStyle;
  inReverse: boolean;
}) {
  const earthquakes = useJson<Earthquakes>('data/earthquake.json');
  if (!earthquakes) return null;
  return (
    <HeatMap
      data={earthquakes.coordinates}
      colorMap={colorMap}
      colorMapInReverse={inReverse}
    />
  );
}

function SpectrumMapContent() {
  const navermaps = useNavermaps();
  const { SpectrumStyle } = navermaps.visualization;
  // 공식 예제는 HOT 하나. 나머지 스펙트럼도 골라 볼 수 있게 한다.
  const [colorMap, setColorMap] = useState(SpectrumStyle.HOT);
  const [inReverse, setInReverse] = useState(false);

  return (
    <>
      <NaverMap
        defaultCenter={{ lat: 36.0207091, lng: 127.9204629 }}
        defaultZoom={8}
      >
        <EarthquakeHeatMap colorMap={colorMap} inReverse={inReverse} />
      </NaverMap>
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 1000,
          padding: '6px 10px',
          background: '#fff',
          border: 'solid 1px #333',
          borderRadius: 5,
          fontSize: 14,
        }}
      >
        <select
          value={colorMap}
          onChange={(e) =>
            setColorMap(
              e.target.value as naver.maps.visualization.SpectrumStyle,
            )
          }
        >
          {Object.values(SpectrumStyle).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <label style={{ marginLeft: 10 }}>
          <input
            type="checkbox"
            checked={inReverse}
            onChange={(e) => setInReverse(e.target.checked)}
          />{' '}
          거꾸로
        </label>
      </div>
    </>
  );
}

function SpectrumMap() {
  return (
    <MapDiv style={{ width: '100%', height: '600px', position: 'relative' }}>
      <SpectrumMapContent />
    </MapDiv>
  );
}

export default function VisualizationTutorial3SpectrumExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04" submodules={['visualization']}>
      <SpectrumMap />
    </NavermapsProvider>
  );
}
