import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Kml,
} from 'react-naver-maps';
import { useXml } from '../samples/remote-data';

function Seorak() {
  // 한 번만 파싱한 Document. 참조가 같으면 다시 올리지 않는다.
  const kml = useXml('data/seorak.kml');
  return kml ? <Kml data={kml} /> : null;
}

export default function DatalayerTutorial3KmlExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <NaverMap
          defaultCenter={{ lat: 38.1361378, lng: 128.4021238 }}
          defaultZoom={12}
        >
          <Seorak />
        </NaverMap>
      </MapDiv>
    </NavermapsProvider>
  );
}
