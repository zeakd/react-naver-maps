import { useMemo } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  useNavermaps,
} from 'react-naver-maps';
import { defaultMapTypes } from './example-ui-a';

const TILE_SIZE = 50;

function BasicMapTypeMapContent() {
  const navermaps = useNavermaps();

  // 타일마다 알파벳 DOM 요소를 반환하는 지도 유형을 기본 유형과 함께 등록합니다.
  const mapTypes = useMemo(() => {
    const mine: Omit<naver.maps.MapType, 'projection'> = {
      name: 'Alphabet',
      minZoom: 0,
      maxZoom: 22,
      tileSize: new navermaps.Size(TILE_SIZE, TILE_SIZE),
      getTile: (x: number, y: number) => {
        const ascii = (Math.abs(x + y) % 26) + 65;
        const div = document.createElement('div');
        div.textContent = String.fromCharCode(ascii);
        div.style.cssText =
          `width:${TILE_SIZE}px;height:${TILE_SIZE}px;font-size:${TILE_SIZE - 10}px;` +
          `line-height:${TILE_SIZE}px;opacity:${1 - (ascii - 65) * 0.04};` +
          'text-align:center;font-weight:bold;border:solid 1px #aaa;color:#fff;' +
          'background-color:#000;';
        return div;
      },
    };
    return new navermaps.MapTypeRegistry({
      ...defaultMapTypes(navermaps),
      // projection은 생략합니다(SDK 기본값). @types에서는 필수이므로 타입 단언이 필요합니다.
      mine: mine as naver.maps.MapType,
    });
  }, [navermaps]);

  return (
    <NaverMap
      defaultCenter={{ lat: 37.3595704, lng: 127.105399 }}
      defaultZoom={15}
      mapTypes={mapTypes}
      defaultMapTypeId="mine"
      mapTypeControl
      mapTypeControlOptions={{ style: navermaps.MapTypeControlStyle.DROPDOWN }}
    />
  );
}

export default function MapTypesTutorial3BasicExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <BasicMapTypeMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
