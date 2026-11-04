import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  CustomControl,
  useNavermaps,
  useMap,
} from 'react-naver-maps';

const buttonStyle = {
  display: 'inline-block',
  width: 34,
  height: 34,
  margin: 5,
  border: '1px solid rgba(58,70,88,.45)',
  borderRadius: 2,
  background: '#fcfcfd',
  backgroundClip: 'padding-box',
  textAlign: 'center',
  cursor: 'pointer',
} as const;

const iconStyle = {
  display: 'inline-block',
  width: 20,
  height: 20,
  margin: '7px 0 0 0',
  background: 'url(https://ssl.pstatic.net/static/maps/m/spr_trff_v6.png) 0 0',
  backgroundSize: '200px 200px',
  backgroundPosition: '-153px -31px',
} as const;

const GREEN_FACTORY = { lat: 37.3595953, lng: 127.1053971 };
// 공식 예제의 두 번째 컨트롤(map.controls[LEFT_CENTER])이 가는 곳. 경도가 조금 다르다.
const GREEN_FACTORY_EAST = { lat: 37.3595953, lng: 127.1553971 };

function HomeControl() {
  const navermaps = useNavermaps();
  const map = useMap();

  return (
    <>
      <CustomControl position={navermaps.Position.TOP_LEFT}>
        <button
          type="button"
          aria-label="NAVER 그린팩토리로 이동"
          style={buttonStyle}
          onClick={() => map.setCenter(GREEN_FACTORY)}
        >
          <span style={iconStyle} />
        </button>
      </CustomControl>
      <CustomControl position={navermaps.Position.LEFT_CENTER}>
        <button
          type="button"
          aria-label="NAVER 그린팩토리 동쪽으로 이동"
          style={buttonStyle}
          onClick={() => map.setCenter(GREEN_FACTORY_EAST)}
        >
          <span style={iconStyle} />
        </button>
      </CustomControl>
    </>
  );
}

export default function CustomControlExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <NaverMap defaultZoom={13}>
          <HomeControl />
        </NaverMap>
      </MapDiv>
    </NavermapsProvider>
  );
}
