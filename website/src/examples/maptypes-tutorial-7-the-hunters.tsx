import { useMemo } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  useNavermaps,
} from 'react-naver-maps';

const HOME_PATH = 'https://navermaps.github.io/maps.js.ncp/docs';

function HuntersMapContent() {
  const navermaps = useNavermaps();

  const { mapTypes, center } = useMemo(() => {
    // 좌표계가 위경도가 아니라 4096 x 4096 픽셀 평면이라 투영법을 직접 정의한다.
    const projection: naver.maps.Projection = {
      fromCoordToPoint(coord) {
        const point =
          coord instanceof navermaps.LatLng
            ? new navermaps.Point(coord.lng(), coord.lat())
            : coord.clone();
        return point.div(256, 256).div(16, 16);
      },
      fromPointToCoord(point) {
        return point.clone().mul(256, 256).mul(16, 16);
      },
    };
    return {
      center: new navermaps.Point(2048, 2048),
      mapTypes: new navermaps.MapTypeRegistry({
        Hunters: new navermaps.ImageMapType({
          name: 'The Hunters',
          minZoom: 0,
          maxZoom: 5,
          tileSize: new navermaps.Size(256, 256),
          projection,
          repeatX: false,
          tileSet: `${HOME_PATH}/tiles/the-hunters/{z}/{x}-{y}.png`,
          darktheme: true,
          vendor: '\xa9 NAVER Corp.',
          uid: 'blizzard:starcraft:the-hunters',
          provider: [
            { title: '/Blizzard', link: 'http://www.blizzard.com' },
            { title: ' /Starcraft Brood war' },
          ],
        }),
      }),
    };
  }, [navermaps]);

  return (
    <NaverMap
      defaultCenter={center}
      defaultZoom={2}
      background="#000000"
      mapTypes={mapTypes}
      defaultMapTypeId="Hunters"
      mapTypeControl
      mapTypeControlOptions={{
        mapTypeIds: ['Hunters'],
        style: navermaps.MapTypeControlStyle.DROPDOWN,
      }}
    />
  );
}

export default function MapTypesTutorial7TheHuntersExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <HuntersMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
