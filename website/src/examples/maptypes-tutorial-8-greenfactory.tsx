import { useMemo } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  useNavermaps,
} from 'react-naver-maps';

const HOME_PATH = 'https://navermaps.github.io/maps.js.ncp/docs';
const FLOORS = ['1F', '2F', '4F', '5F'];

function GreenFactoryMapContent() {
  const navermaps = useNavermaps();

  const { mapTypes, center, mapTypeIds } = useMemo(() => {
    const tileSize = new navermaps.Size(256, 256);
    // 실내 지도 평면 좌표를 타일 크기로 나눠 타일 좌표로 쓴다.
    const projection: naver.maps.Projection = {
      fromCoordToPoint(coord) {
        const point =
          coord instanceof navermaps.LatLng
            ? new navermaps.Point(coord.lng(), coord.lat())
            : (coord as naver.maps.Point).clone();
        return point.div(tileSize.width, tileSize.height);
      },
      fromPointToCoord(point) {
        return point.clone().mul(tileSize.width, tileSize.height);
      },
    };
    const getMapType = (floor: string) =>
      new navermaps.ImageMapType({
        name: floor,
        minZoom: 0,
        maxZoom: 4,
        tileSize,
        projection,
        repeatX: false,
        tileSet: `${HOME_PATH}/tiles/gf-${floor.toLowerCase()}/{z}/{x}-{y}.png`,
        vendor: '\xa9 NAVER Corp.',
        uid: `naver:greenfactory:${floor}`,
      });
    const ids = FLOORS.map((floor) => `+${floor}`);
    return {
      mapTypeIds: ids,
      center: new navermaps.Point(128, 128),
      mapTypes: new navermaps.MapTypeRegistry(
        Object.fromEntries(
          FLOORS.map((floor) => [`+${floor}`, getMapType(floor)]),
        ),
      ),
    };
  }, [navermaps]);

  return (
    <NaverMap
      defaultCenter={center}
      defaultZoom={2}
      background="#FFFFFF"
      mapTypes={mapTypes}
      defaultMapTypeId="+1F"
      mapTypeControl
      mapTypeControlOptions={{
        mapTypeIds,
        position: navermaps.Position.BOTTOM_CENTER,
        style: navermaps.MapTypeControlStyle.BUTTON,
      }}
      zoomControl
      zoomControlOptions={{ position: navermaps.Position.TOP_RIGHT }}
    />
  );
}

export default function MapTypesTutorial8GreenFactoryExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <GreenFactoryMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
