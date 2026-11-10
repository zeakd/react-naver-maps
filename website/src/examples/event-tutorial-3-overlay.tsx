import { useEffect, useRef, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Marker,
  InfoWindow,
  Polyline,
  Polygon,
  Rectangle,
  Circle,
  Ellipse,
  CustomOverlay,
  useListener,
  useNavermaps,
} from 'react-naver-maps';

const polylinePath = [
  { lat: 37.4526437, lng: 126.49236 },
  { lat: 37.4768068, lng: 126.4847975 },
  { lat: 37.4988237, lng: 126.4960839 },
  { lat: 37.5176422, lng: 126.5392841 },
  { lat: 37.5398154, lng: 126.5708743 },
  { lat: 37.5457857, lng: 126.5968815 },
  { lat: 37.5646413, lng: 126.6502792 },
  { lat: 37.5708896, lng: 126.7197823 },
  { lat: 37.5710499, lng: 126.7444216 },
  { lat: 37.5770001, lng: 126.7733532 },
  { lat: 37.5817724, lng: 126.799401 },
  { lat: 37.5841817, lng: 126.8167752 },
  { lat: 37.5808037, lng: 126.8313027 },
  { lat: 37.5716637, lng: 126.8473288 },
  { lat: 37.56136, lng: 126.8619116 },
  { lat: 37.5487926, lng: 126.8852035 },
  { lat: 37.540747, lng: 126.8910651 },
  { lat: 37.5303713, lng: 126.8925982 },
  { lat: 37.5164746, lng: 126.8825719 },
  { lat: 37.5002697, lng: 126.8725686 },
  { lat: 37.4933399, lng: 126.8711786 },
  { lat: 37.4760577, lng: 126.8756663 },
  { lat: 37.4634352, lng: 126.8887979 },
  { lat: 37.448467, lng: 126.8947082 },
  { lat: 37.4346374, lng: 126.8977132 },
  { lat: 37.4242394, lng: 126.8949032 },
  { lat: 37.4033979, lng: 126.8806084 },
  { lat: 37.3848775, lng: 126.8691937 },
  { lat: 37.371033, lng: 126.8693097 },
  { lat: 37.3724101, lng: 126.9126676 },
  { lat: 37.3830471, lng: 126.9660813 },
  { lat: 37.3807849, lng: 126.9762181 },
  { lat: 37.3971504, lng: 127.0267188 },
  { lat: 37.3961676, lng: 127.0715545 },
  { lat: 37.3730718, lng: 127.0659032 },
  { lat: 37.35114, lng: 127.063139 },
  { lat: 37.3268898, lng: 127.0575003 },
  { lat: 37.3210994, lng: 127.0517556 },
  { lat: 37.3084352, lng: 127.0590529 },
  { lat: 37.2877049, lng: 127.0692822 },
  { lat: 37.2762087, lng: 127.0808982 },
];

const polygonPaths = [
  [
    { lat: 37.4189396, lng: 126.9947576 },
    { lat: 37.3911035, lng: 126.9616861 },
    { lat: 37.3644604, lng: 126.9387485 },
    { lat: 37.3403527, lng: 126.9649387 },
    { lat: 37.3216031, lng: 126.9043952 },
    { lat: 37.2881378, lng: 126.903215 },
    { lat: 37.2541204, lng: 127.0362754 },
    { lat: 37.2924506, lng: 127.1068025 },
    { lat: 37.2395506, lng: 127.1633591 },
    { lat: 37.2492336, lng: 127.4216687 },
    { lat: 37.4938588, lng: 127.4851262 },
    { lat: 37.4267, lng: 127.2608991 },
    { lat: 37.418252, lng: 127.1191646 },
  ],
];

const rectangleBounds = {
  south: 37.5315893,
  west: 127.1291527,
  north: 37.5924988,
  east: 127.2149296,
};

const ellipseBounds = {
  south: 37.1793196,
  west: 127.6795594,
  north: 37.5398662,
  east: 128.4312422,
};

const MARKER_POSITION = { lat: 37.3614483, lng: 127.1114883 };
const PINK_POSITION = { lat: 37.4857788, lng: 127.0659301 };
const GREEN_POSITION = { lat: 37.123267, lng: 127.0659301 };
const CUSTOM_OVERLAY_POSITION = { lat: 37.2849483, lng: 127.1229117 };

// 공식 예제의 CSS 클래스(cs_mapbridge 등) 대신 색이 있는 핀 모양을 사용합니다.
const pinHtml = (color: string) =>
  `<div style="width:38px;height:58px;display:flex;justify-content:center;">` +
  `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);` +
  `background:${color};border:2px solid #fff;box-shadow:1px 1px 3px rgba(0,0,0,.6);margin-top:8px;"></div></div>`;
const pinkIcon = {
  content: pinHtml('#f06292'),
  size: { width: 38, height: 58 },
  anchor: { x: 19, y: 58 },
};
const greenIcon = {
  content: pinHtml('#43a047'),
  size: { width: 38, height: 58 },
  anchor: { x: 19, y: 58 },
};

type Opened = {
  content: string;
  anchor: naver.maps.Marker | naver.maps.CoordLiteral;
};

/** 반지름을 duration(ms) 동안 부드럽게 바꿉니다. */
function useAnimatedRadius(initial: number) {
  const [radius, setRadius] = useState(initial);
  const radiusRef = useRef(initial);
  const frameRef = useRef(0);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  function animateTo(target: number, duration = 500) {
    cancelAnimationFrame(frameRef.current);
    const from = radiusRef.current;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      radiusRef.current = from + (target - from) * t;
      setRadius(radiusRef.current);
      if (t < 1) frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
  }

  return { radius, animateTo, targetRef: radiusRef };
}

function EventOverlayMapContent() {
  const navermaps = useNavermaps();
  const mapRef = useRef<naver.maps.Map>(null);
  const markerRef = useRef<naver.maps.Marker>(null);
  const pinkRef = useRef<naver.maps.Marker>(null);
  const greenRef = useRef<naver.maps.Marker>(null);

  const [opened, setOpened] = useState<Opened | null>(null);
  const [message, setMessage] = useState('');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [polylineWeight, setPolylineWeight] = useState(6);
  const [polygonOpacity, setPolygonOpacity] = useState(0.35);
  const [rectangleWeight, setRectangleWeight] = useState(2);
  const circle = useAnimatedRadius(3000);
  const [ellipse, setEllipse] = useState<naver.maps.Ellipse | null>(null);
  const [ellipsePressed, setEllipsePressed] = useState(false);

  // Ellipse에는 touchstart, touchend의 on* prop이 없어 useListener로 받습니다.
  useListener(ellipse, 'touchstart', () => setEllipsePressed(true));
  useListener(ellipse, 'touchend', () => setEllipsePressed(false));

  const openAt = (content: string, anchor: Opened['anchor'] | null) => {
    if (anchor) setOpened({ content, anchor });
  };

  return (
    <>
      <NaverMap
        ref={mapRef}
        defaultZoom={10}
        defaultCenter={MARKER_POSITION}
        zoomControl
        zoomControlOptions={{
          style: navermaps.ZoomControlStyle.SMALL,
          position: navermaps.Position.RIGHT_CENTER,
        }}
        cursor={cursor}
        onClick={() => setOpened(null)}
      >
        <Marker
          ref={markerRef}
          position={MARKER_POSITION}
          clickable
          onClick={() => openAt('DEFAULT MARKER', markerRef.current)}
        />
        <Marker
          ref={pinkRef}
          position={PINK_POSITION}
          title="Pink Marker"
          icon={pinkIcon}
          onClick={() => openAt('HTML MARKER', pinkRef.current)}
        />
        <Marker
          ref={greenRef}
          position={GREEN_POSITION}
          title="Green Marker"
          icon={greenIcon}
          draggable
          onClick={() => openAt('HTML MARKER', greenRef.current)}
        />
        <Polyline
          path={polylinePath}
          strokeColor="#00CA00"
          strokeOpacity={0.8}
          strokeWeight={polylineWeight}
          zIndex={2}
          clickable
          onMousedown={() => setPolylineWeight(20)}
          onMouseup={() => setPolylineWeight(6)}
          onClick={() => setMessage('polyline click')}
        />
        <Polygon
          paths={polygonPaths}
          strokeColor="#FF0000"
          strokeOpacity={0.8}
          strokeWeight={2}
          fillColor="#FF0000"
          fillOpacity={polygonOpacity}
          zIndex={1}
          clickable
          onMouseover={() => {
            setCursor('pointer');
            setPolygonOpacity(0.8);
          }}
          onMouseout={() => {
            setCursor('auto');
            setPolygonOpacity(0.35);
          }}
          onClick={() => setMessage('polygon click')}
        />
        <Rectangle
          bounds={rectangleBounds}
          strokeColor="#ff00ff"
          strokeOpacity={0.8}
          strokeWeight={rectangleWeight}
          fillColor="#ff00ff"
          fillOpacity={0.35}
          clickable
          // 마우스를 움직일 때마다 선이 굵어집니다(50을 넘으면 1로 변경).
          onMousemove={() => setRectangleWeight((w) => (w >= 50 ? 1 : w + 1))}
          onClick={() => setMessage('rectangle click')}
        />
        <Circle
          center={{ lat: 37.3376733, lng: 126.6954694 }}
          radius={circle.radius}
          strokeColor="#0000ff"
          strokeOpacity={0.8}
          strokeWeight={2}
          fillColor="#0000ff"
          fillOpacity={0.35}
          zIndex={100}
          clickable
          // 더블클릭하면 반지름이 3000과 6000을 오갑니다.
          onDblclick={() =>
            circle.animateTo(circle.targetRef.current <= 3000 ? 6000 : 3000)
          }
        />
        <Ellipse
          ref={setEllipse}
          bounds={ellipseBounds}
          strokeColor={ellipsePressed ? 'yellow' : 'yellowgreen'}
          strokeOpacity={1}
          strokeWeight={3}
          fillColor={ellipsePressed ? 'yellow' : 'yellowgreen'}
          fillOpacity={0.3}
          clickable
          onClick={() => mapRef.current?.fitBounds(ellipseBounds)}
        />
        <CustomOverlay position={CUSTOM_OVERLAY_POSITION} pane="overlayLayer">
          <div
            style={{
              width: 124,
              backgroundColor: '#F2F0EA',
              textAlign: 'center',
              border: '2px solid #6C483B',
              cursor: 'pointer',
            }}
            onClick={() => openAt('CUSTOM OVERLAY', CUSTOM_OVERLAY_POSITION)}
          >
            <img
              src="https://navermaps.github.io/maps.js.ncp/docs/img/example/brown.png"
              alt="Brown"
              style={{ width: 120, height: 130 }}
            />
            <span style={{ fontWeight: 'bold' }}> Brown </span>
          </div>
        </CustomOverlay>
        {opened && (
          <InfoWindow
            open
            anchor={opened.anchor}
            content={`<div style="padding:20px;">${opened.content}</div>`}
          />
        )}
      </NaverMap>
      {message && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1000,
            margin: 5,
            padding: '2px 8px',
            backgroundColor: '#fff',
            border: 'solid 1px #333',
            fontSize: 14,
          }}
        >
          {message}
        </div>
      )}
    </>
  );
}

export default function EventTutorial3OverlayExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04">
      <MapDiv style={{ width: '100%', height: '600px' }}>
        <EventOverlayMapContent />
      </MapDiv>
    </NavermapsProvider>
  );
}
