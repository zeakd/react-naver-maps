import { useMemo } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Layer,
  useNavermaps,
} from 'react-naver-maps';

function TileCheckMapContent() {
  const navermaps = useNavermaps();

  // getTile은 타일마다 DOM 요소를 반환합니다.
  // 렌더마다 새로 만들면 레이어가 다시 만들어지므로 useMemo로 한 번만 만듭니다.
  const tileGrid = useMemo<Omit<naver.maps.MapType, 'projection'>>(
    () => ({
      name: 'TileGrid',
      minZoom: -1,
      maxZoom: 14,
      tileSize: new navermaps.Size(256, 256),
      getTile: (x: number, y: number, z: number) => {
        const div = document.createElement('div');
        div.textContent = `(${[z, x, y].join(', ')})`;
        div.style.cssText =
          'position:absolute;z-index:100;font-size:20px;text-align:left;color:#f00;' +
          'background-color:transparent;border:solid 1px #f00;width:234px;height:234px;' +
          'padding:10px;box-sizing:content-box;';
        return div;
      },
    }),
    [navermaps],
  );

  return (
    <NaverMap
      defaultCenter={{ lat: 37.3595704, lng: 127.105399 }}
      defaultZoom={15}
      mapTypeControl
      mapTypeControlOptions={{ style: navermaps.MapTypeControlStyle.DROPDOWN }}
    >
      {/* projection은 생략합니다(SDK 기본값). */}
      <Layer name="tileGrid" mapTypes={tileGrid} />
    </NaverMap>
  );
}

export default function MapTypesTutorial1TileCheckExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <TileCheckMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
