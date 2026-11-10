import { useMemo } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  useNavermaps,
} from 'react-naver-maps';
import { defaultMapTypes } from './example-ui-a';

function ImageMapTypeMapContent() {
  const navermaps = useNavermaps();

  // 기본 유형에 OSM 이미지 타일 유형을 더한 레지스트리를 한 번만 만듭니다.
  const mapTypes = useMemo(() => {
    const osm = new navermaps.ImageMapType({
      name: 'OSM',
      minZoom: 0,
      maxZoom: 19,
      tileSize: new navermaps.Size(256, 256),
      projection: navermaps.EPSG3857,
      repeatX: true,
      tileSet: 'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      provider: [
        {
          // 출처 표기는 이미지 제공처의 정책을 따라야 합니다.
          title: ' /OpenStreetMap',
          link: 'http://www.openstreetmap.org/copyright',
        },
      ],
    });
    return new navermaps.MapTypeRegistry({
      ...defaultMapTypes(navermaps),
      osm,
    });
  }, [navermaps]);

  return (
    <NaverMap
      defaultCenter={{ lat: 37.3595704, lng: 127.105399 }}
      defaultZoom={15}
      mapTypes={mapTypes}
      defaultMapTypeId="osm"
      mapTypeControl
      mapTypeControlOptions={{ style: navermaps.MapTypeControlStyle.DROPDOWN }}
    />
  );
}

export default function MapTypesTutorial2ImageMapTypeExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <ImageMapTypeMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
