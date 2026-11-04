import { useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Rectangle,
  Circle,
  Ellipse,
  Polygon,
} from 'react-naver-maps';

// SVG <pattern> 을 문서에 두고 fillColor 에 `url(#id)` 로 가리킨다.
const patterns = ['stripes', 'dots', 'checks', 'cross', 'zigzag'] as const;
type PatternId = (typeof patterns)[number];

const fill = (id: PatternId) => `url(#rnm-pattern-${id})`;
const randomPattern = () =>
  patterns[Math.floor(Math.random() * patterns.length)];

function PatternDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <pattern
          id="rnm-pattern-stripes"
          width="12"
          height="12"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="12" height="12" fill="#fff" />
          <rect width="6" height="12" fill="#2d6cdf" />
        </pattern>
        <pattern
          id="rnm-pattern-dots"
          width="14"
          height="14"
          patternUnits="userSpaceOnUse"
        >
          <rect width="14" height="14" fill="#fff" />
          <circle cx="7" cy="7" r="3.5" fill="#e0457b" />
        </pattern>
        <pattern
          id="rnm-pattern-checks"
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
        >
          <rect width="16" height="16" fill="#fff" />
          <rect width="8" height="8" fill="#2ba84a" />
          <rect x="8" y="8" width="8" height="8" fill="#2ba84a" />
        </pattern>
        <pattern
          id="rnm-pattern-cross"
          width="14"
          height="14"
          patternUnits="userSpaceOnUse"
        >
          <rect width="14" height="14" fill="#fff" />
          <path d="M0 0L14 14M14 0L0 14" stroke="#f08a00" strokeWidth="2" />
        </pattern>
        <pattern
          id="rnm-pattern-zigzag"
          width="20"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <rect width="20" height="10" fill="#fff" />
          <path
            d="M0 8L5 2L10 8L15 2L20 8"
            fill="none"
            stroke="#7f5bd5"
            strokeWidth="2"
          />
        </pattern>
      </defs>
    </svg>
  );
}

const polygonPaths = [
  [
    { lat: 37.37544345085402, lng: 127.11224555969238 },
    { lat: 37.37230584065902, lng: 127.10791110992432 },
    { lat: 37.35975408751081, lng: 127.10795402526855 },
    { lat: 37.359924641705476, lng: 127.11576461791992 },
    { lat: 37.35931064479073, lng: 127.12211608886719 },
    { lat: 37.36043630196386, lng: 127.12293148040771 },
    { lat: 37.36354029942161, lng: 127.12310314178465 },
    { lat: 37.365211629488016, lng: 127.12456226348876 },
    { lat: 37.37544345085402, lng: 127.11224555969238 },
  ],
  [
    { lat: 37.368485964153784, lng: 127.10971355438232 },
    { lat: 37.368520071054576, lng: 127.11464881896971 },
    { lat: 37.36350619025713, lng: 127.11473464965819 },
    { lat: 37.363403862670665, lng: 127.1097993850708 },
    { lat: 37.368485964153784, lng: 127.10971355438232 },
  ],
];

function OverlayPatternMapContent() {
  // 도형마다 지금 채우는 무늬. 마우스를 올리거나 벗어나면 무작위 무늬로 바꾼다.
  const [rect, setRect] = useState<PatternId>('stripes');
  const [circle, setCircle] = useState<PatternId>('dots');
  const [ellipse, setEllipse] = useState<PatternId>('checks');
  const [polygon, setPolygon] = useState<PatternId>('cross');
  const [polygonHover, setPolygonHover] = useState(false);

  return (
    <NaverMap
      defaultCenter={{ lat: 37.3558304, lng: 127.1169609 }}
      defaultZoom={13}
    >
      <Rectangle
        bounds={{
          south: 37.3577018,
          west: 127.0714298,
          north: 37.3647967,
          east: 127.0888535,
        }}
        fillColor={fill(rect)}
        clickable
        onMouseover={() => setRect(randomPattern())}
        onMouseout={() => setRect(randomPattern())}
      />
      <Circle
        center={{ lat: 37.3461711, lng: 127.1140877 }}
        radius={1000}
        fillColor={fill(circle)}
        fillOpacity={0.8}
        clickable
        onMouseover={() => setCircle(randomPattern())}
        onMouseout={() => setCircle(randomPattern())}
      />
      <Ellipse
        bounds={{
          south: 37.3595273,
          west: 127.1390194,
          north: 37.3653941,
          east: 127.1666569,
        }}
        strokeOpacity={1}
        strokeWeight={1}
        fillColor={fill(ellipse)}
        fillOpacity={0.9}
        clickable
        onMouseover={() => setEllipse(randomPattern())}
        onMouseout={() => setEllipse(randomPattern())}
      />
      <Polygon
        paths={polygonPaths}
        fillColor={fill(polygon)}
        fillOpacity={0.3}
        strokeColor={polygonHover ? '#7F5BD5' : '#0072FF'}
        strokeOpacity={polygonHover ? 1 : 0.6}
        strokeWeight={3}
        clickable
        onMouseover={() => setPolygonHover(true)}
        onMouseout={() => setPolygonHover(false)}
        onClick={() => setPolygon(randomPattern())}
      />
    </NaverMap>
  );
}

export default function OverlayPatternExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <PatternDefs />
      <MapDiv style={{ width: '100%', height: '400px' }}>
        <OverlayPatternMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
