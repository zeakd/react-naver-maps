import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
} from 'react-naver-maps';
import { DotMap } from 'react-naver-maps/visualization';
import { useJson } from '../samples/remote-data';

type Earthquakes = { coordinates: React.ComponentProps<typeof DotMap>['data'] };

function EarthquakeDotMap() {
  const earthquakes = useJson<Earthquakes>('data/earthquake_weight.json');
  if (!earthquakes) return null;
  return <DotMap data={earthquakes.coordinates} radius={20} />;
}

export default function VisualizationTutorial5DotmapWExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04" submodules={['visualization']}>
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <NaverMap
          defaultCenter={{ lat: 36.0207091, lng: 127.9204629 }}
          defaultZoom={8}
        >
          <EarthquakeDotMap />
        </NaverMap>
      </MapDiv>
    </NavermapsProvider>
  );
}
