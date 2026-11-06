import { useMemo } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  useNavermaps,
} from 'react-naver-maps';

const TILE_SIZE = 50;

// 타일마다 알파벳을 canvas 에 그려 ImageData 로 돌려준다.
function getTileData(x: number, y: number) {
  const ascii = (Math.abs(x + y) % 26) + 65;
  const canvas = document.createElement('canvas');
  canvas.width = TILE_SIZE;
  canvas.height = TILE_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new ImageData(TILE_SIZE, TILE_SIZE);
  ctx.globalAlpha = 1 - (ascii - 65) * 0.04;
  ctx.rect(0, 0, TILE_SIZE, TILE_SIZE);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#aaa';
  ctx.stroke();
  ctx.font = `bold ${TILE_SIZE - 10}px Arial`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.fillText(String.fromCharCode(ascii), TILE_SIZE / 2, TILE_SIZE / 2);
  return ctx.getImageData(0, 0, TILE_SIZE, TILE_SIZE);
}

function CanvasMapTypeMapContent() {
  const navermaps = useNavermaps();

  const mapTypes = useMemo(
    () =>
      new navermaps.MapTypeRegistry({
        Alphabet: new navermaps.CanvasMapType({
          name: 'Alphabet',
          minZoom: 0,
          maxZoom: 22,
          tileSize: new navermaps.Size(TILE_SIZE, TILE_SIZE),
          getTileData,
          // projection 은 생략한다(SDK 기본).
        }),
      }),
    [navermaps],
  );

  return (
    <NaverMap
      defaultCenter={{ lat: 28.084179775000003, lng: 25.216796875 }}
      defaultZoom={10}
      mapTypes={mapTypes}
      defaultMapTypeId="Alphabet"
    />
  );
}

export default function MapTypesTutorial9CanvasMapTypeExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <CanvasMapTypeMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
