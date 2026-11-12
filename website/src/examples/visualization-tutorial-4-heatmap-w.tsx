import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
} from 'react-naver-maps';
import { HeatMap } from 'react-naver-maps/visualization';
import { useJson } from '../samples/remote-data';

type Earthquakes = {
  coordinates: React.ComponentProps<typeof HeatMap>['data'];
};

function EarthquakeHeatMap() {
  const earthquakes = useJson<Earthquakes>('data/earthquake_weight.json');
  if (!earthquakes) return null;
  return <HeatMap data={earthquakes.coordinates} />;
}

export default function VisualizationTutorial4HeatmapWExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04" submodules={['visualization']}>
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <NaverMap
          defaultCenter={{ lat: 36.0207091, lng: 127.9204629 }}
          defaultZoom={8}
        >
          <EarthquakeHeatMap />
        </NaverMap>
      </MapDiv>
    </NavermapsProvider>
  );
}
