import { useMemo } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  GeoJson,
  useMap,
} from 'react-naver-maps';
import { useJsonAll } from '../samples/remote-data';

type Feature = { type: 'Feature'; geometry: Record<string, unknown> };
type Collection = { type: 'FeatureCollection'; features: Feature[] };

// 공식 예제는 geometry 안에 mantle_properties(스타일 값)를 넣은 GeoJSON을 사용합니다.
// 같은 형태로 강원도(01), 경기도(02) 경계에 스타일 값을 붙입니다.
const MANTLE = { strokeOpacity: 0.7, strokeWeight: 2, fillOpacity: 0.7 };
const COLORS = ['green', 'darkgreen'];

type Mantle = typeof MANTLE & { strokeColor: string; fillColor: string };

// autoStyle이 geometry의 mantle_properties를 스타일로 쓰고 클릭한 feature만 덮어씁니다.
const mantleStyle = (feature: naver.maps.Feature) => {
  if (feature.getProperty('focus')) {
    return {
      fillOpacity: 0.6,
      fillColor: '#0f0',
      strokeColor: '#0f0',
      strokeWeight: 4,
      strokeOpacity: 1,
    };
  }
  const geometry = feature.getGeometries()[0] as unknown as {
    getRaw(): { mantle_properties?: Mantle };
  };
  return geometry.getRaw().mantle_properties;
};

function Provinces() {
  const map = useMap();
  const files = useJsonAll<Collection>([
    'data/region01.json',
    'data/region02.json',
  ]);
  const data = useMemo(
    () =>
      files && {
        type: 'FeatureCollection' as const,
        features: files.flatMap((file, i) =>
          file.features.map((feature) => ({
            ...feature,
            geometry: {
              ...feature.geometry,
              mantle_properties: {
                ...MANTLE,
                strokeColor: COLORS[i],
                fillColor: COLORS[i],
              },
            },
          })),
        ),
      },
    [files],
  );
  if (!data) return null;

  return (
    <GeoJson
      data={data as unknown as naver.maps.GeoJSON}
      autoStyle
      style={mantleStyle}
      onClick={(e) =>
        e.feature.setProperty('focus', !e.feature.getProperty('focus'))
      }
      onMouseover={(e) =>
        map.data.overrideStyle(e.feature, {
          fillOpacity: 1,
          strokeWeight: 10,
          strokeOpacity: 1,
        })
      }
      onMouseout={() => map.data.revertStyle()}
    />
  );
}

export default function MantleTutorial5PropertiesExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <NaverMap
          defaultCenter={{ lat: 36.4203004, lng: 128.31796 }}
          defaultZoom={7}
        >
          <Provinces />
        </NaverMap>
      </MapDiv>
    </NavermapsProvider>
  );
}
