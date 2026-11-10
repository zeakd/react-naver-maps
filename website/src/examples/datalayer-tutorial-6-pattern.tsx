import { useMemo, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  GeoJson,
  useMap,
} from 'react-naver-maps';
import { useJsonAll } from '../samples/remote-data';

const REGION_PATHS = Array.from(
  { length: 17 },
  (_, i) => `data/region${String(i + 1).padStart(2, '0')}.json`,
);

// 공식 예제는 18개의 SVG 패턴을 사용합니다. 여기서는 같은 방식으로 직접 만든 패턴 6개를 사용합니다.
const PATTERNS: Record<string, React.ReactNode> = {
  stripes: (
    <>
      <rect width="8" height="8" fill="#fff" />
      <path d="M0 0L8 8" stroke="#7f5bd5" strokeWidth="2" />
    </>
  ),
  dots: (
    <>
      <rect width="10" height="10" fill="#fff" />
      <circle cx="5" cy="5" r="2" fill="#ec3d77" />
    </>
  ),
  grid: (
    <>
      <rect width="10" height="10" fill="#fff" />
      <path d="M0 0H10M0 0V10" stroke="#04a8f4" strokeWidth="1" />
    </>
  ),
  waves: (
    <>
      <rect width="20" height="10" fill="#fff" />
      <path
        d="M0 5Q5 0 10 5T20 5"
        fill="none"
        stroke="#f2b01e"
        strokeWidth="1.5"
      />
    </>
  ),
  checks: (
    <>
      <rect width="12" height="12" fill="#fff" />
      <rect width="6" height="6" fill="#03c75a" />
      <rect x="6" y="6" width="6" height="6" fill="#03c75a" />
    </>
  ),
  triangles: (
    <>
      <rect width="12" height="12" fill="#fff" />
      <path d="M0 12L6 0L12 12Z" fill="#ff8a65" />
    </>
  ),
};
const PATTERN_IDS = Object.keys(PATTERNS);
const PATTERN_SIZE: Record<string, [number, number]> = {
  stripes: [8, 8],
  dots: [10, 10],
  grid: [10, 10],
  waves: [20, 10],
  checks: [12, 12],
  triangles: [12, 12],
};

// 지역 이름으로 패턴을 정해 렌더마다 바뀌지 않게 합니다.
const patternOf = (name: string) =>
  `region-${PATTERN_IDS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % PATTERN_IDS.length]}`;

const patternStyle = (feature: naver.maps.Feature) => {
  const focus = feature.getProperty('focus');
  return {
    fillColor: `url(#${patternOf(feature.getProperty('area1'))})`,
    fillOpacity: focus ? 0.01 : 0.8,
    strokeColor: focus ? '#04A8F4' : '#7F5BD5',
    strokeWeight: focus ? 4 : 2,
    strokeOpacity: focus ? 1 : 0.4,
  };
};

function PatternDefs() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: 'absolute' }}
      aria-hidden="true"
    >
      <defs>
        {PATTERN_IDS.map((id) => (
          <pattern
            key={id}
            id={`region-${id}`}
            patternUnits="userSpaceOnUse"
            width={PATTERN_SIZE[id][0]}
            height={PATTERN_SIZE[id][1]}
            patternTransform="scale(2)"
          >
            {PATTERNS[id]}
          </pattern>
        ))}
      </defs>
    </svg>
  );
}

type Tooltip = { x: number; y: number; text: string };

function Regions({
  onTooltip,
}: {
  onTooltip: (tooltip: Tooltip | null) => void;
}) {
  const map = useMap();
  const files = useJsonAll<naver.maps.GeoJSON & { features: unknown[] }>(
    REGION_PATHS,
  );
  const regions = useMemo(
    () =>
      files && {
        type: 'FeatureCollection' as const,
        features: files.flatMap((f) => f.features),
      },
    [files],
  );
  if (!regions) return null;

  return (
    <GeoJson
      data={regions as unknown as naver.maps.GeoJSON}
      style={patternStyle}
      onClick={(e) =>
        e.feature.setProperty('focus', !e.feature.getProperty('focus'))
      }
      onMouseover={(e) => {
        onTooltip({
          x: e.offset.x,
          y: e.offset.y,
          text: e.feature.getProperty('area1'),
        });
        map.data.overrideStyle(e.feature, {
          fillOpacity: 0.6,
          strokeWeight: 4,
          strokeOpacity: 1,
        });
      }}
      onMouseout={() => {
        onTooltip(null);
        map.data.revertStyle();
      }}
    />
  );
}

export default function DatalayerTutorial6PatternExample() {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <PatternDefs />
      <MapDiv style={{ width: '100%', height: '600px', position: 'relative' }}>
        <NaverMap
          defaultCenter={{ lat: 36.4203004, lng: 128.31796 }}
          defaultZoom={7}
        >
          <Regions onTooltip={setTooltip} />
        </NaverMap>
        {tooltip && (
          <div
            style={{
              position: 'absolute',
              zIndex: 1000,
              left: tooltip.x,
              top: tooltip.y,
              padding: '5px 10px',
              backgroundColor: '#fff',
              border: 'solid 2px #000',
              fontSize: '14px',
              pointerEvents: 'none',
            }}
          >
            {tooltip.text}
          </div>
        )}
      </MapDiv>
    </NavermapsProvider>
  );
}
