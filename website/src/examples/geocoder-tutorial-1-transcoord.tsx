import { useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  InfoWindow,
  useNavermaps,
} from 'react-naver-maps';

type Converted = {
  latlng: string;
  utmk: string;
  tm128: string;
  naver: string;
  at: { lat: number; lng: number };
};

function TransCoordMap() {
  const navermaps = useNavermaps();
  const [converted, setConverted] = useState<Converted | null>(null);

  // 클릭한 위경도를 UTMK, TM128, NAVER 좌표로 차례로 바꿉니다. TransCoord는 geocoder 서브모듈에서 받습니다.
  const convert = (coord: naver.maps.Coord) => {
    const { TransCoord } = navermaps;
    const latlng = coord;
    const utmk = TransCoord.fromLatLngToUTMK(latlng);
    const tm128 = TransCoord.fromUTMKToTM128(utmk);
    const naverCoord = TransCoord.fromTM128ToNaver(tm128);
    utmk.x = parseFloat(utmk.x.toFixed(1));
    utmk.y = parseFloat(utmk.y.toFixed(1));
    setConverted({
      latlng: latlng.toString(),
      utmk: utmk.toString(),
      tm128: tm128.toString(),
      naver: naverCoord.toString(),
      at: { lat: latlng.y, lng: latlng.x },
    });
  };

  return (
    <NaverMap
      defaultCenter={{ lat: 37.5666103, lng: 126.9783882 }}
      defaultZoom={16}
      onClick={(e) => convert(e.coord)}
    >
      {converted && (
        <InfoWindow
          open
          position={converted.at}
          content={`<div style="padding:10px;width:380px;font-size:14px;line-height:20px;">
<strong>LatLng</strong> : ${converted.latlng}<br />
<strong>UTMK</strong> : ${converted.utmk}<br />
<strong>TM128</strong> : ${converted.tm128}<br />
<strong>NAVER</strong> : ${converted.naver}<br />
</div>`}
        />
      )}
    </NaverMap>
  );
}

export default function GeocoderTutorial1TranscoordExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04" submodules={['geocoder']}>
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <TransCoordMap />
      </MapDiv>
    </NavermapsProvider>
  );
}
