import type { NextPage } from 'next';
import { NaverMap, MapDiv } from 'react-naver-maps';

const Home: NextPage = () => {
  return (
    <MapDiv style={{ width: 400, height: 400 }}>
      <NaverMap />
    </MapDiv>
  );
};

export default Home;
