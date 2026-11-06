import { useMemo, useRef, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Layer,
  Marker,
  InfoWindow,
  useNavermaps,
} from 'react-naver-maps';

const CENTER = { lat: 37.3595704, lng: 127.105399 };

function TileIndexMapContent() {
  const navermaps = useNavermaps();
  const mapRef = useRef<naver.maps.Map>(null);
  const [tileIndex, setTileIndex] = useState<[number, number] | null>(null);

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

  // 중심 좌표를 투영법으로 옮겨 타일 크기로 나누면 타일 인덱스다. 지도 init 뒤에 읽을 수 있다.
  function computeTileIndex() {
    const map = mapRef.current;
    if (!map) return;
    const tileSize = map.mapTypes.getSelectedType().tileSize.width;
    const projection = map.getProjection();
    const zoom = map.getZoom();
    const centerPixel = projection.fromCoordToPoint(map.getCenter());
    // scaleUp 은 Point 를 주면 Point 를 준다(@types 는 합집합으로 적어 둬서 단언이 필요하다).
    const pixel = projection.scaleUp(centerPixel, zoom) as naver.maps.Point;
    setTileIndex([
      Math.floor(Math.floor(pixel.x) / tileSize),
      Math.floor(Math.floor(pixel.y) / tileSize),
    ]);
  }

  return (
    <NaverMap
      ref={mapRef}
      defaultCenter={CENTER}
      defaultZoom={15}
      mapTypeControl
      mapTypeControlOptions={{ style: navermaps.MapTypeControlStyle.DROPDOWN }}
      onInit={computeTileIndex}
    >
      {/* projection 은 생략한다(SDK 기본). */}
      <Layer name="tileGrid" mapTypes={tileGrid} />
      <Marker position={CENTER} />
      {tileIndex && (
        <InfoWindow
          open
          position={CENTER}
          content={`<div style="width:150px;text-align:center;padding:10px;">(xIndex, yIndex) <b>(${tileIndex[0]}, ${tileIndex[1]})</b></div>`}
        />
      )}
    </NaverMap>
  );
}

export default function TileIndexExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <TileIndexMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
