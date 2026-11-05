import { useCallback, useEffect, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Rectangle,
  Polygon,
  useNavermaps,
} from 'react-naver-maps';
import { DrawingManager } from 'react-naver-maps/drawing';

const RECT_BOUNDS = {
  south: 37.561622,
  west: 126.96744,
  north: 37.5668781,
  east: 126.9737437,
};
const POLYGON_PATHS = [
  [126.9797895, 37.5670131],
  [126.979215, 37.5649555],
  [126.9766789, 37.5649082],
  [126.9789515, 37.5637645],
  [126.9785598, 37.5614914],
  [126.9804949, 37.5632666],
  [126.9827689, 37.5619065],
  [126.9818039, 37.5639213],
  [126.9837414, 37.5653719],
  [126.9811162, 37.5651081],
].map(([lng, lat]) => ({ lat, lng }));
const FILL = {
  fillColor: '#ff0000',
  fillOpacity: 0.4,
  strokeWeight: 2,
  strokeColor: '#ff0000',
};

const OVERLAY_NAMES = [
  'rectangle',
  'ellipse',
  'polyline',
  'arrowline',
  'polygon',
  'marker',
];
const EVENT_SUFFIXES = ['Added', 'Selected', 'Removed'];

/** 그리기 도구가 내는 이벤트를 모아 목록으로 보여 준다. */
function DrawingEventLog({
  manager,
  lines,
  onLine,
}: {
  manager: naver.maps.drawing.DrawingManager;
  lines: string[];
  onLine: (line: string) => void;
}) {
  const navermaps = useNavermaps();
  const { DrawingEvents } = navermaps.drawing;

  // 도형 종류별 이벤트(rectangleAdded 등)는 prop 이 없어 SDK 리스너로 받는다.
  useEffect(() => {
    const names = [
      ...OVERLAY_NAMES.flatMap((name) =>
        EVENT_SUFFIXES.map((suffix) => name + suffix),
      ),
      DrawingEvents.ADD,
      DrawingEvents.SELECT,
      DrawingEvents.REMOVE,
    ];
    const listeners = names.map((name) =>
      manager.addListener(name, () => onLine(name)),
    );
    return () => navermaps.Event.removeListener(listeners);
  }, [manager, navermaps, DrawingEvents, onLine]);

  return (
    <div
      style={{
        position: 'absolute',
        left: 10,
        bottom: 10,
        zIndex: 1000,
        width: 240,
        height: 150,
        overflowY: 'auto',
        padding: 6,
        background: 'rgba(255,255,255,0.9)',
        border: 'solid 1px #333',
        fontSize: 12,
      }}
    >
      <strong>Occurred Events</strong>
      {lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
}

function DrawingMapContent() {
  const navermaps = useNavermaps();
  const { DrawingMode } = navermaps.drawing;
  const [manager, setManager] =
    useState<naver.maps.drawing.DrawingManager | null>(null);
  const [rect, setRect] = useState<naver.maps.Rectangle | null>(null);
  const [polygon, setPolygon] = useState<naver.maps.Polygon | null>(null);
  const [lines, setLines] = useState<string[]>([]);
  const log = useCallback(
    (line: string) => setLines((prev) => [...prev, line]),
    [],
  );

  // 미리 올려 둔 도형을 그리기 도구가 다루게 한다(addDrawing).
  useEffect(() => {
    if (!manager || !rect || !polygon) return;
    manager.addDrawing(rect, DrawingMode.RECTANGLE, 'my-id');
    manager.addDrawing(polygon, DrawingMode.POLYGON);
  }, [manager, rect, polygon, DrawingMode]);

  return (
    <>
      <NaverMap
        defaultCenter={{ lat: 37.5651, lng: 126.9783 }}
        defaultZoom={15}
        zoomControl
        zoomControlOptions={{
          style: navermaps.ZoomControlStyle.LARGE,
          position: navermaps.Position.TOP_RIGHT,
        }}
        mapTypeControl
      >
        <Rectangle ref={setRect} defaultBounds={RECT_BOUNDS} {...FILL} />
        <Polygon ref={setPolygon} defaultPaths={[POLYGON_PATHS]} {...FILL} />
        <DrawingManager ref={setManager} />
      </NaverMap>
      {manager && (
        <DrawingEventLog manager={manager} lines={lines} onLine={log} />
      )}
    </>
  );
}

function DrawingMap() {
  return (
    <MapDiv style={{ width: '100%', height: '600px', position: 'relative' }}>
      <DrawingMapContent />
    </MapDiv>
  );
}

export default function DrawingTutorial1SimpleExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04" submodules={['drawing']}>
      <DrawingMap />
    </NavermapsProvider>
  );
}
