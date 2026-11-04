import { useMemo, useRef, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  useNavermaps,
} from 'react-naver-maps';
import { defaultMapTypes } from './example-ui-a';

function NaverOsmMapContent() {
  const navermaps = useNavermaps();
  const mapRef = useRef<naver.maps.Map>(null);
  const [mapTypeId, setMapTypeId] = useState<string>('normal');
  // 줌 효과 뒤 첫 idle 은 건너뛴다(공식 예제가 zooming 동안 idle 리스너를 떼는 것과 같다).
  const skipIdleRef = useRef(false);

  const { mapTypes, korea } = useMemo(() => {
    const osm = new navermaps.ImageMapType({
      name: 'OSM',
      minZoom: 0,
      maxZoom: 19,
      tileSize: new navermaps.Size(256, 256),
      projection: navermaps.EPSG3857,
      repeatX: true,
      tileSet: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      provider: [
        {
          title: ' /OpenStreetMap',
          link: 'http://www.openstreetmap.org/copyright',
        },
      ],
    });
    return {
      mapTypes: new navermaps.MapTypeRegistry({
        ...defaultMapTypes(navermaps),
        osm,
      }),
      korea: new navermaps.LatLngBounds(
        new navermaps.LatLng(30.1391277, 115.0607471),
        new navermaps.LatLng(48.940448, 139.7803655),
      ),
    };
  }, [navermaps]);

  // 지도 화면이 한국 경계를 벗어나면 OSM, 안에 들어오면 네이버 일반 지도로 바꾼다.
  function checkBounds() {
    if (skipIdleRef.current) {
      skipIdleRef.current = false;
      return;
    }
    const bounds = mapRef.current?.getBounds();
    if (!bounds) return;
    setMapTypeId(korea.hasBounds(bounds) ? 'normal' : 'osm');
  }

  return (
    <NaverMap
      ref={mapRef}
      defaultCenter={{ lat: 37.3595704, lng: 127.105399 }}
      defaultZoom={7}
      mapTypes={mapTypes}
      mapTypeId={mapTypeId}
      onMapTypeIdChanged={setMapTypeId}
      mapTypeControl
      mapTypeControlOptions={{ style: navermaps.MapTypeControlStyle.BUTTON }}
      onZoomstart={() => {
        skipIdleRef.current = true;
      }}
      onIdle={checkBounds}
    />
  );
}

export default function MapTypesTutorial5NaverOsmExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <NaverOsmMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
