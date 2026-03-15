import { useEffect, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  useNavermaps,
  useMap,
} from 'react-naver-maps';

const locationBtnHtml = `
<a href="#" style="
  z-index: 100;
  overflow: hidden;
  display: inline-block;
  position: absolute;
  top: 7px;
  left: 5px;
  width: 34px;
  height: 34px;
  border: 1px solid rgba(58,70,88,.45);
  border-radius: 2px;
  background: #fcfcfd;
  background-clip: border-box;
  text-align: center;
  -webkit-background-clip: padding;
  background-clip: padding-box;
">
  <span style="
    overflow: hidden;
    display: inline-block;
    color: transparent !important;
    vertical-align: top;
    background: url(https://ssl.pstatic.net/static/maps/m/spr_trff_v6.png) 0 0;
    background-size: 200px 200px;
    width: 20px;
    height: 20px;
    margin: 7px 0 0 0;
    background-position: -153px -31px;
  ">NAVER 그린팩토리</span>
</a>
`;

function MyCustomControl() {
  const navermaps = useNavermaps();
  const map = useMap();

  useEffect(() => {
    // 방법 1: CustomControl 객체 사용
    const customControl = new navermaps.CustomControl(locationBtnHtml, {
      position: navermaps.Position.TOP_LEFT,
    });
    customControl.setMap(map);

    const domElement = customControl.getElement();
    const handleClick1 = () => {
      map.setCenter(new navermaps.LatLng(37.3595953, 127.1053971));
    };
    domElement.addEventListener('click', handleClick1);

    // 방법 2: map.controls 활용
    const parent = document.createElement('div');
    parent.innerHTML = locationBtnHtml;
    const locationBtnEl = parent.children[0] as HTMLElement;
    map.controls[naver.maps.Position.LEFT_CENTER].push(locationBtnEl);

    const handleClick2 = () => {
      map.setCenter(new navermaps.LatLng(37.3595953, 127.1053971));
    };
    locationBtnEl.addEventListener('click', handleClick2);

    return () => {
      domElement.removeEventListener('click', handleClick1);
      locationBtnEl.removeEventListener('click', handleClick2);
      customControl.setMap(null);
    };
  }, [map, navermaps]);

  return null;
}

function CustomControlMapInner() {
  useNavermaps(); // 네이버맵 스크립트 로드 대기
  const [init, setInit] = useState(false);

  return (
    <MapDiv style={{ width: '100%', height: '600px' }}>
      <NaverMap defaultZoom={13} onInit={() => setInit(true)}>
        {init && <MyCustomControl />}
      </NaverMap>
    </MapDiv>
  );
}

export default function CustomControlExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <CustomControlMapInner />
    </NavermapsProvider>
  );
}
