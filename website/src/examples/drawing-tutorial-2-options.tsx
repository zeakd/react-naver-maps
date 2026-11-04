import { useEffect, useState } from 'react';
import {
  NavermapsProvider,
  Container as MapDiv,
  NaverMap,
  Rectangle,
  useNavermaps,
} from 'react-naver-maps';
import { DrawingManager } from 'react-naver-maps/drawing';
import { DOCS_URL } from '../samples/remote-data';

const POSITIONS = [
  'LEFT_TOP',
  'LEFT_CENTER',
  'LEFT_BOTTOM',
  'RIGHT_TOP',
  'RIGHT_CENTER',
  'RIGHT_BOTTOM',
  'TOP_LEFT',
  'TOP_CENTER',
  'TOP_RIGHT',
  'BOTTOM_LEFT',
  'BOTTOM_CENTER',
  'BOTTOM_RIGHT',
] as const;
const STYLES = [
  'HORIZONTAL',
  'VERTICAL',
  'HORIZONTAL_2',
  'VERTICAL_2',
] as const;
const MODES = [
  'HAND',
  'RECTANGLE',
  'ELLIPSE',
  'POLYLINE',
  'ARROWLINE',
  'POLYGON',
  'MARKER',
] as const;

const panelStyle: React.CSSProperties = {
  border: '1px solid #b4b4b4',
  borderRadius: 4,
  padding: 10,
  background: '#fff',
  fontSize: 12,
  display: 'inline-block',
  verticalAlign: 'top',
  marginRight: 6,
};

// 컴포넌트 밖의 상수: 렌더마다 새 객체가 되지 않게 한다.
const controlPointOptions = {
  anchorPointOptions: {
    radius: 5,
    fillColor: '#ff0000',
    strokeColor: '#0000ff',
    strokeWeight: 2,
  },
  midPointOptions: {
    radius: 4,
    fillColor: '#ff0000',
    strokeColor: '#0000ff',
    strokeWeight: 2,
    fillOpacity: 0.5,
  },
};
const markerOptions = {
  icon: {
    content: `<img src="${DOCS_URL}/img/example/pin_default.png" alt="" style="margin:0;padding:0;border:0 solid transparent;display:block;max-width:none;max-height:none;-webkit-user-select:none;position:absolute;width:22px;height:35px;left:0;top:0">`,
    size: { width: 22, height: 35 },
    anchor: { x: 11, y: 35 },
  },
};

function DrawingOptionsMap() {
  const navermaps = useNavermaps();
  const { DrawingMode, DrawingStyle } = navermaps.drawing;
  const [manager, setManager] =
    useState<naver.maps.drawing.DrawingManager | null>(null);
  const [rect, setRect] = useState<naver.maps.Rectangle | null>(null);
  const [rect2, setRect2] = useState<naver.maps.Rectangle | null>(null);

  // 도구 막대의 위치·모양·아이콘은 state 로 두고 prop 으로 넘긴다.
  const [position, setPosition] =
    useState<(typeof POSITIONS)[number]>('RIGHT_CENTER');
  const [style, setStyle] = useState<(typeof STYLES)[number]>('VERTICAL');
  const [icons, setIcons] = useState<number[]>([
    DrawingMode.POLYLINE,
    DrawingMode.POLYGON,
    DrawingMode.ELLIPSE,
    DrawingMode.RECTANGLE,
  ]);

  // 직접 setEditable 을 불러 편집 가능하게 한 도형.
  useEffect(() => {
    rect2?.setEditable(true);
  }, [rect2]);
  // 그리기 도구가 다루는 도형으로 등록한다.
  useEffect(() => {
    if (manager && rect)
      manager.addDrawing(rect, DrawingMode.RECTANGLE, 'my-id');
  }, [manager, rect, DrawingMode]);

  return (
    <>
      <MapDiv style={{ width: '100%', height: '500px' }}>
        <NaverMap
          defaultCenter={{ lat: 37.5, lng: 126.5 }}
          defaultZoom={7}
          zoomControl
          zoomControlOptions={{
            style: navermaps.ZoomControlStyle.LARGE,
            position: navermaps.Position.TOP_RIGHT,
          }}
          mapTypeControl
        >
          <Rectangle
            ref={setRect}
            defaultBounds={{
              west: 125.6195858,
              south: 37.1928595,
              east: 126.5689034,
              north: 37.8594302,
            }}
            fillColor="#00bf46"
            fillOpacity={0.4}
            strokeWeight={2}
            strokeColor="#00bf46"
          />
          <Rectangle
            ref={setRect2}
            defaultBounds={{
              west: 124.2220128,
              south: 37.1928595,
              east: 125.1587723,
              north: 37.8594302,
            }}
            fillColor="#bf0091"
            fillOpacity={0.4}
            strokeWeight={2}
            strokeColor="#bf0091"
          />
          <DrawingManager
            ref={setManager}
            drawingControl={icons}
            drawingControlOptions={{
              position: navermaps.Position[position],
              style: DrawingStyle[style],
            }}
            controlPointOptions={controlPointOptions}
            rectangleOptions={{
              fillColor: '#ff0000',
              fillOpacity: 0.5,
              strokeWeight: 3,
              strokeColor: '#ff0000',
            }}
            ellipseOptions={{
              fillColor: '#ff25dc',
              fillOpacity: 0.5,
              strokeWeight: 3,
              strokeColor: '#ff25dc',
            }}
            polylineOptions={{ strokeColor: '#222', strokeWeight: 3 }}
            arrowlineOptions={{ endIconSize: 16, strokeWeight: 3 }}
            polygonOptions={{
              fillColor: '#ffc300',
              fillOpacity: 0.5,
              strokeWeight: 3,
              strokeColor: '#ffc300',
            }}
            markerOptions={markerOptions}
          />
        </NaverMap>
      </MapDiv>
      <div style={{ marginTop: 8 }}>
        <div style={panelStyle}>
          <strong>위치</strong>
          {POSITIONS.map((name) => (
            <div key={name}>
              <label>
                <input
                  type="radio"
                  name="position"
                  checked={position === name}
                  onChange={() => setPosition(name)}
                />{' '}
                {name}
              </label>
            </div>
          ))}
        </div>
        <div style={panelStyle}>
          <strong>스타일</strong>
          {STYLES.map((name) => (
            <div key={name}>
              <label>
                <input
                  type="radio"
                  name="style"
                  checked={style === name}
                  onChange={() => setStyle(name)}
                />{' '}
                {name.toLowerCase()}
              </label>
            </div>
          ))}
        </div>
        <div style={panelStyle}>
          <strong>아이콘</strong>
          {MODES.map((name) => {
            const mode = DrawingMode[name];
            return (
              <div key={name}>
                <label>
                  <input
                    type="checkbox"
                    checked={icons.includes(mode)}
                    onChange={(e) =>
                      setIcons((prev) =>
                        e.target.checked
                          ? [...prev, mode]
                          : prev.filter((m) => m !== mode),
                      )
                    }
                  />{' '}
                  {name}
                </label>
              </div>
            );
          })}
          <button onClick={() => setIcons([])}>모두제거</button>{' '}
          <button
            onClick={() => setIcons(MODES.map((name) => DrawingMode[name]))}
          >
            모두추가
          </button>
        </div>
      </div>
    </>
  );
}

export default function DrawingTutorial2OptionsExample() {
  return (
    <NavermapsProvider ncpKeyId="aluya4ff04" submodules={['drawing']}>
      <DrawingOptionsMap />
    </NavermapsProvider>
  );
}
