import { Container as MapDiv, NaverMap } from 'react-naver-maps';

export default function BasicMap() {
  return (
    <MapDiv style={{ width: '100%', height: '400px' }}>
      <NaverMap />
    </MapDiv>
  );
}
