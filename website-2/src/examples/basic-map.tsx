import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
} from 'react-naver-maps';

export default function BasicMap() {
  return (
    <NavermapsProvider ncpClientId="6tdrlcyvpt">
      <MapDiv style={{ width: '100%', height: '400px' }}>
        <NaverMap />
      </MapDiv>
    </NavermapsProvider>
  );
}
