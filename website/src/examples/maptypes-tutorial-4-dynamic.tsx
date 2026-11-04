import { useMemo, useRef, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Marker,
  useNavermaps,
} from 'react-naver-maps';

const TILE_SIZES = [
  [64, 64],
  [128, 128],
  [256, 256],
  [512, 512],
  [256, 128],
  [256, 64],
] as const;

function DynamicMapContent() {
  const navermaps = useNavermaps();
  const mapRef = useRef<naver.maps.Map>(null);
  const [tileSize, setTileSize] = useState<string>('256x256');

  // 두 지도 유형. 인스턴스를 직접 들고 있다가 타일 크기를 바꾼다. 한 번만 만든다.
  const { mapTypes, mapTypeList } = useMemo(() => {
    const naverNormal = navermaps.NaverStyleMapTypeOptions.getNormalMap();
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
      mapTypes: new navermaps.MapTypeRegistry({ naver: naverNormal, osm }),
      mapTypeList: [naverNormal, osm],
    };
  }, [navermaps]);

  function changeTileSize(value: string) {
    const [width, height] = value.split('x').map(Number);
    for (const mapType of mapTypeList) {
      const options = mapType.getMapTypeOptions();
      options.tileSize = new navermaps.Size(width, height);
      mapType.setMapTypeOptions(options);
    }
    // 타일을 새 크기로 다시 그린다(효과 없이).
    mapRef.current?.refresh(true);
    setTileSize(value);
  }

  return (
    <>
      <NaverMap
        ref={mapRef}
        defaultCenter={{ lat: 37.3595704, lng: 127.105399 }}
        mapTypes={mapTypes}
        defaultMapTypeId="naver"
        mapTypeControl
        mapTypeControlOptions={{ style: navermaps.MapTypeControlStyle.BUTTON }}
      >
        <Marker position={{ lat: 37.3595704, lng: 127.105399 }} />
      </NaverMap>
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          zIndex: 1000,
          padding: '5px 10px',
          backgroundColor: '#fff',
          border: 'solid 1px #333',
          fontSize: 14,
        }}
      >
        <strong>타일 크기 변경</strong>
        <br />
        {TILE_SIZES.map(([width, height]) => {
          const value = `${width}x${height}`;
          return (
            <label key={value} style={{ marginRight: 15 }}>
              <input
                type="radio"
                name="tile-size"
                value={value}
                checked={tileSize === value}
                onChange={() => changeTileSize(value)}
              />{' '}
              {width} x {height}
            </label>
          );
        })}
      </div>
    </>
  );
}

export default function MapTypesTutorial4DynamicExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <DynamicMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
