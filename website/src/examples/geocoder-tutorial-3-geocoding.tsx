import { useEffect, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  InfoWindow,
  useNavermaps,
} from 'react-naver-maps';
import {
  geocode,
  reverseGeocode,
  type ReverseGeocodeResult,
} from 'react-naver-maps/geocoder';

type Area = { name?: string };
type ResultItem = ReverseGeocodeResult['results'][number];

const hasArea = (area?: Area) => !!area?.name;
const hasData = (data?: string) => !!data;

/** 역지오코딩 결과 한 건을 한 줄 주소로 만든다. */
function makeAddress(item?: ResultItem) {
  if (!item) return '';
  const { name, region, land } = item;
  const isRoadAddress = name === 'roadaddr';
  let sido = '';
  let sigugun = '';
  let dongmyun = '';
  let ri = '';
  let rest = '';
  if (hasArea(region.area1)) sido = region.area1.name;
  if (hasArea(region.area2)) sigugun = region.area2.name;
  if (hasArea(region.area3)) dongmyun = region.area3.name;
  if (hasArea(region.area4)) ri = region.area4.name;
  if (land) {
    if (hasData(land.number1)) {
      if (hasData(land.type) && land.type === '2') rest += '산';
      rest += land.number1;
      if (hasData(land.number2)) rest += `-${land.number2}`;
    }
    if (isRoadAddress) {
      if (dongmyun.endsWith('면')) {
        ri = land.name;
      } else {
        dongmyun = land.name;
        ri = '';
      }
      if (land.addition0?.value) rest += ` ${land.addition0.value}`;
    }
  }
  return [sido, sigugun, dongmyun, ri, rest].join(' ');
}

type Popup = { at: { lat: number; lng: number }; html: string };

const wrap = (body: string) =>
  `<div style="padding:10px;min-width:200px;line-height:150%;">${body}</div>`;

function GeocodingMap() {
  const navermaps = useNavermaps();
  const [center, setCenter] = useState({ lat: 37.3595316, lng: 127.1052133 });
  const [popup, setPopup] = useState<Popup | null>(null);
  const [address, setAddress] = useState('정자동 178-1');
  const [error, setError] = useState<string | null>(null);

  // 주소 → 좌표
  const searchAddressToCoordinate = async (query: string) => {
    try {
      setError(null);
      const { meta, addresses } = await geocode(navermaps, { query });
      if (meta.totalCount === 0) {
        setError(`검색 결과가 없습니다 (totalCount ${meta.totalCount})`);
        return;
      }
      const item = addresses[0];
      const lines = [
        item.roadAddress && `[도로명 주소] ${item.roadAddress}`,
        item.jibunAddress && `[지번 주소] ${item.jibunAddress}`,
        item.englishAddress && `[영문명 주소] ${item.englishAddress}`,
      ].filter(Boolean);
      const at = { lat: Number(item.y), lng: Number(item.x) };
      setCenter(at);
      setPopup({
        at,
        html: wrap(
          `<h4 style="margin-top:5px;">검색 주소 : ${query}</h4><br />${lines.join('<br />')}`,
        ),
      });
    } catch (e) {
      setError(
        `주소 검색에 실패했습니다: ${e instanceof Error ? e.message : e}`,
      );
    }
  };

  // 좌표 → 주소
  const searchCoordinateToAddress = async (coords: {
    lat: number;
    lng: number;
  }) => {
    setPopup(null);
    try {
      setError(null);
      const { results } = await reverseGeocode(navermaps, {
        coords,
        orders: [
          navermaps.Service.OrderType.ADDR,
          navermaps.Service.OrderType.ROAD_ADDR,
        ].join(','),
      });
      const lines = results.map((item, i) => {
        const type = item.name === 'roadaddr' ? '[도로명 주소]' : '[지번 주소]';
        return `${i + 1}. ${type} ${makeAddress(item)}`;
      });
      setPopup({
        at: coords,
        html: wrap(
          `<h4 style="margin-top:5px;">검색 좌표</h4><br />${lines.join('<br />')}`,
        ),
      });
    } catch (e) {
      setError(
        `좌표 검색에 실패했습니다: ${e instanceof Error ? e.message : e}`,
      );
    }
  };

  useEffect(() => {
    void searchAddressToCoordinate('정자동 178-1');
    // 처음 한 번만 검색한다.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <NaverMap
        center={center}
        onCenterChanged={(c) =>
          setCenter({
            lat: c.y,
            lng: c.x,
          })
        }
        defaultZoom={15}
        mapTypeControl
        cursor="pointer"
        onClick={(e) => {
          const coord = e.coord;
          void searchCoordinateToAddress({ lat: coord.y, lng: coord.x });
        }}
      >
        {popup && (
          <InfoWindow
            open
            position={popup.at}
            content={popup.html}
            anchorSkew
            onClose={() => setPopup(null)}
          />
        )}
      </NaverMap>
      <form
        style={{ position: 'absolute', zIndex: 1000, top: 20, left: 20 }}
        onSubmit={(e) => {
          e.preventDefault();
          void searchAddressToCoordinate(address);
        }}
      >
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={{
            width: 150,
            height: 20,
            border: 'solid 1px #555',
            padding: 5,
            fontSize: 12,
            boxSizing: 'content-box',
          }}
        />{' '}
        <button
          type="submit"
          style={{
            height: 30,
            padding: '0 10px',
            fontSize: 12,
            border: 'solid 1px #555',
            borderRadius: 3,
            cursor: 'pointer',
            background: '#fff',
          }}
        >
          검색
        </button>
        {error && (
          <div
            style={{
              marginTop: 6,
              padding: 6,
              background: '#fff',
              color: '#c00',
              fontSize: 12,
              maxWidth: 320,
            }}
          >
            {error}
          </div>
        )}
      </form>
    </>
  );
}

export default function GeocoderTutorial3GeocodingExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04" submodules={['geocoder']}>
      <MapDiv style={{ width: '100%', height: '600px', position: 'relative' }}>
        <GeocodingMap />
      </MapDiv>
    </NavermapsProvider>
  );
}
