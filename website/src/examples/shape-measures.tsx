import { useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Polyline,
  Polygon,
  CustomOverlay,
  useNavermaps,
} from 'react-naver-maps';

const CURSOR_URL = 'https://navermaps.github.io/maps.js.ncp/docs/img';

type Pt = naver.maps.LatLngLiteral;
type Mode = 'distance' | 'area';
type Label = { position: Pt; kind: Mode; value: number; total?: boolean };
type Done = { kind: Mode; path: Pt[] };

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  color: '#555',
  border: 'solid 1px #333',
  borderRadius: '5px',
  fontSize: '16px',
  padding: '1px 6px',
  margin: '0 5px 5px 0',
  cursor: 'pointer',
};

function formatDistance(meters: number) {
  return meters >= 1000
    ? `${parseFloat((meters / 1000).toFixed(1))}km`
    : `${parseFloat(meters.toFixed(1))}m`;
}

function formatArea(squareMeters: number) {
  return squareMeters >= 1000 * 1000 ? (
    <>
      {parseFloat((squareMeters / 1000000).toFixed(1))}km<sup>2</sup>
    </>
  ) : (
    <>
      {parseFloat(squareMeters.toFixed(1))}m<sup>2</sup>
    </>
  );
}

function ShapeMeasuresMapContent() {
  const navermaps = useNavermaps();
  const [mode, setMode] = useState<Mode | null>(null);
  // 재는 중인 점들, 마우스 위치(안내선), 끝난 도형, 이정표(거리·면적 글자)
  const [path, setPath] = useState<Pt[]>([]);
  const [mouse, setMouse] = useState<Pt | null>(null);
  const [done, setDone] = useState<Done[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  // 재는 중인 구간의 이정표는 끝내면 labels로 옮기고 취소하면 지웁니다.
  const [segments, setSegments] = useState<Label[]>([]);

  // 길이·면적은 SDK로 잽니다. 지도에 표시하지 않는 도형을 이벤트 안에서 잠시 만듭니다.
  const distanceOf = (points: Pt[]) =>
    new navermaps.Polyline({
      path: points.map((p) => new navermaps.LatLng(p)),
    }).getDistance();
  const areaOf = (points: Pt[]) =>
    new navermaps.Polygon({
      paths: [points.map((p) => new navermaps.LatLng(p))],
    }).getAreaSize();

  function reset() {
    setPath([]);
    setMouse(null);
    setSegments([]);
  }

  function finish() {
    if (mode === 'distance' && path.length > 0) {
      setDone((d) => [...d, { kind: 'distance', path }]);
      setLabels((l) => [
        ...l,
        ...segments,
        {
          position: path[path.length - 1],
          kind: 'distance',
          value: distanceOf(path),
          total: true,
        },
      ]);
    }
    if (mode === 'area' && path.length > 0) {
      setDone((d) => [...d, { kind: 'area', path }]);
      setLabels((l) => [
        ...l,
        {
          position: path[path.length - 1],
          kind: 'area',
          value: areaOf(path),
          total: true,
        },
      ]);
    }
    reset();
    setMode(null);
  }

  function toggle(next: Mode) {
    // 측정 중인 것은 지우고 완료한 것은 남긴 채 모드를 바꿉니다.
    reset();
    setMode((prev) => (prev === next ? null : next));
  }

  function onMapClick(e: naver.maps.PointerEvent) {
    if (!mode) return;
    const point = { lat: e.coord.y, lng: e.coord.x };
    const next = [...path, point];
    if (mode === 'distance' && path.length > 0) {
      // 직전 점부터 이번 점까지의 거리를 이정표로 표시합니다.
      setSegments((l) => [
        ...l,
        {
          position: point,
          kind: 'distance',
          value: distanceOf(next) - distanceOf(path),
        },
      ]);
    }
    setPath(next);
  }

  // 마우스를 따라가는 점은 거리의 안내선 또는 면적의 마지막 꼭짓점이 됩니다.
  const live = mode && mouse ? [...path, mouse] : path;

  return (
    <>
      <NaverMap
        defaultCenter={{ lat: 35.3657244, lng: 127.1645619 }}
        defaultZoom={7}
        cursor={
          mode
            ? `url('${CURSOR_URL}/${mode === 'distance' ? 'rule' : 'area'}.cur'), default`
            : 'auto'
        }
        onClick={onMapClick}
        onRightclick={finish}
        onMousemove={(e) => {
          if (mode && path.length > 0)
            setMouse({ lat: e.coord.y, lng: e.coord.x });
        }}
      >
        {done.map((d, i) =>
          d.kind === 'distance' ? (
            <Polyline
              key={i}
              path={d.path}
              strokeColor="#f00"
              strokeWeight={5}
              strokeOpacity={0.8}
            />
          ) : (
            <Polygon
              key={i}
              paths={[d.path]}
              strokeColor="#00f"
              strokeOpacity={0.6}
              strokeWeight={5}
              fillColor="#00f"
              fillOpacity={0.3}
            />
          ),
        )}
        {mode === 'distance' && path.length > 0 && (
          <>
            <Polyline
              path={path}
              strokeColor="#f00"
              strokeWeight={5}
              strokeOpacity={0.8}
            />
            <Polyline
              path={live.slice(-2)}
              strokeColor="#f00"
              strokeWeight={5}
              strokeStyle="shortdash"
              strokeOpacity={0.6}
            />
          </>
        )}
        {mode === 'area' && path.length > 0 && (
          <Polygon
            paths={[live]}
            strokeColor="#00f"
            strokeOpacity={0.6}
            strokeWeight={5}
            fillColor="#00f"
            fillOpacity={0.3}
          />
        )}
        {[...labels, ...segments].map((label, i) => (
          <CustomOverlay key={i} position={label.position}>
            <div
              style={{
                display: 'inline-block',
                margin: '5px 0 0 5px',
                padding: 5,
                textAlign: 'center',
                backgroundColor: '#fff',
                border: '1px solid #000',
                fontSize: label.total ? 14 : 11,
                fontWeight: label.total ? 'bold' : 'normal',
                color: label.total
                  ? label.kind === 'distance'
                    ? '#f00'
                    : '#00f'
                  : undefined,
              }}
            >
              {label.kind === 'distance'
                ? formatDistance(label.value)
                : formatArea(label.value)}
            </div>
          </CustomOverlay>
        ))}
      </NaverMap>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1000,
          padding: 5,
        }}
      >
        <button
          style={{
            ...buttonStyle,
            fontWeight: mode === 'distance' ? 'bold' : 'normal',
            borderColor: mode === 'distance' ? '#f00' : '#333',
          }}
          onClick={() => toggle('distance')}
        >
          거리재기
        </button>
        <button
          style={{
            ...buttonStyle,
            fontWeight: mode === 'area' ? 'bold' : 'normal',
            borderColor: mode === 'area' ? '#00f' : '#333',
          }}
          onClick={() => toggle('area')}
        >
          면적재기
        </button>
        <button
          style={buttonStyle}
          onClick={() => {
            reset();
            setMode(null);
            setDone([]);
            setLabels([]);
          }}
        >
          지우기
        </button>
        <div style={{ background: '#fff', padding: '2px 6px', fontSize: 13 }}>
          지도를 눌러 점을 찍고, 오른쪽 버튼으로 끝냅니다.
        </div>
      </div>
    </>
  );
}

export default function ShapeMeasuresExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px', position: 'relative' }}>
        <ShapeMeasuresMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
