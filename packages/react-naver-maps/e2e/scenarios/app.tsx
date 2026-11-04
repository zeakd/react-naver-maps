import { Activity, StrictMode, use, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import {
  BicycleLayer,
  Circle,
  Container,
  CustomControl,
  DotMap,
  DrawingManager,
  FlightSpot,
  LabelLayer,
  Layer,
  GeoJson,
  Gpx,
  Kml,
  geocode,
  GroundOverlay,
  HeatMap,
  InfoWindow,
  loadScript,
  Marker,
  NaverMap,
  NavermapsProvider,
  Panorama,
  Polygon,
  Polyline,
  reverseGeocode,
  useAutoResize,
  useKVO,
  useMap,
} from './target.js';
import type { Submodule } from './target.js';
import type { AppConfig, LL, TraceFrame } from './types.js';

// Maps 키. Web 서비스 URL 에 http://localhost:4321 이 등록되어 있다.
export const NCP_KEY_ID = 'aluya4ff04';
export const INITIAL_CENTER: LL = [37.5666, 126.9784];
export const INITIAL_ZOOM = 15;

const EVENTS = [
  'center_changed',
  'zoom_changed',
  'bounds_changed',
  'idle',
  'dragstart',
  'dragend',
  'click',
];
const OBSERVED_METHODS = [
  'panTo',
  'panBy',
  'morph',
  'setCenter',
  'setCenterPoint',
  'setZoom',
  'fitBounds',
];
const OBSERVED_SHAPE_METHODS = ['setPath', 'setOptions'];
const OBSERVED_MARKER_METHODS = ['setIcon', 'setPosition', 'setAnimation'];
// 지도 중앙 둘레의 점들([경도, 위도]).
const HEAT_POINTS: naver.maps.PointArrayLiteral[] = Array.from(
  { length: 30 },
  (_, i) => [126.9784 + 0.001 * Math.cos(i), 37.5666 + 0.001 * Math.sin(i)],
);

// 같은 점을 공식 튜토리얼의 { weight, location: [경도, 위도] } 모양으로.
const HEAT_WEIGHTED = HEAT_POINTS.map((location) => ({ weight: 3, location }));

// 지도 중앙(INITIAL_CENTER)을 덮는 사각형.
const CENTER_SQUARE: naver.maps.GeoJSON = {
  type: 'Feature',
  properties: { id: 'center' },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [126.97, 37.56],
        [126.99, 37.56],
        [126.99, 37.575],
        [126.97, 37.575],
        [126.97, 37.56],
      ],
    ],
  },
} as naver.maps.GeoJSON;

// 지도 중앙 근처의 작은 KML·GPX. 문서는 한 번만 만든다(렌더마다 같은 Document).
const KML_TEXT = {
  point:
    '<kml xmlns="http://www.opengis.net/kml/2.2"><Document><Placemark><name>a</name><Point><coordinates>126.9784,37.5666</coordinates></Point></Placemark></Document></kml>',
  line: '<kml xmlns="http://www.opengis.net/kml/2.2"><Document><Placemark><name>b</name><LineString><coordinates>126.97,37.56 126.98,37.57</coordinates></LineString></Placemark><Placemark><name>c</name><Point><coordinates>126.975,37.565</coordinates></Point></Placemark></Document></kml>',
};
const GPX_TEXT =
  '<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>t</name><trkseg><trkpt lat="37.56" lon="126.97"></trkpt><trkpt lat="37.565" lon="126.975"></trkpt><trkpt lat="37.57" lon="126.98"></trkpt></trkseg></trk></gpx>';
const xmlDocs = new Map<string, Document>();
function xml(text: string): Document {
  let doc = xmlDocs.get(text);
  if (!doc) {
    doc = new DOMParser().parseFromString(text, 'text/xml');
    xmlDocs.set(text, doc);
  }
  return doc;
}

// 타일마다 테두리 div 를 그리는 지도 유형. 한 번만 만든다.
let tileGrid: naver.maps.MapType | null = null;
function tileGridType(): naver.maps.MapType {
  tileGrid ??= {
    name: 'TileGrid',
    minZoom: 0,
    maxZoom: 22,
    tileSize: new naver.maps.Size(256, 256),
    projection: naver.maps.EPSG3857,
    repeatX: true,
    getTile: () => {
      const el = document.createElement('div');
      el.className = 'tile-grid';
      el.style.cssText =
        'width:256px;height:256px;border:1px solid red;box-sizing:border-box';
      return el;
    },
  } as unknown as naver.maps.MapType;
  return tileGrid;
}

// 투영을 생략한 사용자 지도 유형(공식 예제 tutorial-3-maptypes-basic 과 같은 모양). 한 번만 만든다.
let projectionless: naver.maps.MapTypeRegistry | null = null;
function projectionlessRegistry(): naver.maps.MapTypeRegistry {
  projectionless ??= new naver.maps.MapTypeRegistry(
    {
      normal: naver.maps.NaverStyleMapTypeOptions.getNormalMap(),
      mine: {
        name: 'Alphabet',
        minZoom: 0,
        maxZoom: 22,
        tileSize: new naver.maps.Size(50, 50),
        getTile: () => document.createElement('div'),
      } as unknown as naver.maps.MapType,
    },
    'mine',
  );
  return projectionless;
}

// 첫 꼭짓점이 지도 중앙(INITIAL_CENTER)인 삼각형.
const EDITABLE_PATHS = [
  [
    { lat: 37.5666, lng: 126.9784 },
    { lat: 37.5666, lng: 126.982 },
    { lat: 37.5645, lng: 126.98 },
  ],
];

const STABLE_PATH = [
  { lat: 37.56, lng: 126.97 },
  { lat: 37.57, lng: 126.98 },
];

type Observed = {
  calls: string[];
  events: string[];
  zoomReports: number[];
  kvo: { zoom: number; lat: number };
  markerClicks: number;
  circleClicks: number;
  marker: naver.maps.Marker | null;
  recordMarker: (marker: naver.maps.Marker | null) => void;
  /** ref 로 받은 오버레이. 떨어져도 마지막 인스턴스를 본다. */
  overlays: Record<string, { getMap(): unknown }>;
  geoJsonClicks: number;
  recordGeoJsonClick: () => void;
  drawingManager: naver.maps.drawing.DrawingManager | null;
  recordDrawingManager: (o: naver.maps.drawing.DrawingManager | null) => void;
  drawingAdded: number;
  recordDrawingAdded: () => void;
  control: naver.maps.CustomControl | null;
  recordControl: (o: naver.maps.CustomControl | null) => void;
  groundOverlays: Set<unknown>;
  polygon: naver.maps.Polygon | null;
  recordPolygon: (o: naver.maps.Polygon | null) => void;
  /** 지금까지 만들어진 Layer 인스턴스 */
  layers: Set<unknown>;
  recordGroundOverlay: (o: unknown) => void;
  recordOverlay: (name: string, o: { getMap(): unknown } | null) => void;
  recordCircleClick: () => void;
  recordKvo: (zoom: number, lat: number) => void;
  recordMarkerClick: () => void;
};

const OBSERVED = Symbol('observed');

/** target 의 메서드 호출을 calls 에 적는다. 이미 감싼 메서드는 다시 감싸지 않는다. */
function observe(target: object, methods: string[], calls: string[]) {
  const proto = target as Record<
    string,
    ((...args: unknown[]) => unknown) & { [OBSERVED]?: true }
  >;
  for (const method of methods) {
    const original = proto[method];
    if (!original || original[OBSERVED]) continue;
    const wrapped = function (this: unknown, ...args: unknown[]) {
      calls.push(method);
      return original.apply(this, args);
    };
    proto[method] = Object.assign(wrapped, { [OBSERVED]: true as const });
  }
}

function AutoResize() {
  useAutoResize(useMap());
  return null;
}

function KvoProbe({ observed }: { observed: Observed }) {
  const map = useMap();
  const zoom = useKVO<number>(map, 'zoom');
  const center = useKVO<naver.maps.Coord>(map, 'center');
  // 투영이 없는 사용자 지도 유형에서는 Point 다.
  observed.recordKvo(
    zoom,
    // 인증에 실패하면 SDK 가 naver.maps 를 비우므로 클래스 대신 메서드로 가른다.
    'lat' in center && typeof center.lat === 'function'
      ? center.lat()
      : (center as naver.maps.Point).y,
  );
  return null;
}

function controlCount(map: naver.maps.Map) {
  const positions = Object.values(map.controls ?? {}) as unknown as {
    getLength?: () => number;
  }[];
  return positions.reduce((sum, p) => sum + (p?.getLength?.() ?? 0), 0);
}

function toCoord(ll: LL) {
  return { lat: ll[0], lng: ll[1] };
}

const suspensions = new Map<number, Promise<void>>();

/** key 마다 한 번, 200ms(가상 시계) 동안 suspend 한다. */
function Suspender({ k }: { k: number }) {
  let p = suspensions.get(k);
  if (!p) {
    // 시뮬레이터에서도 가상 시계를 타도록 window 의 타이머를 쓴다.
    p = new Promise<void>((resolve) => window.setTimeout(resolve, 200));
    suspensions.set(k, p);
  }
  use(p);
  return null;
}

function MapUnderTest({
  config,
  observed,
  onMap,
}: {
  config: AppConfig;
  observed: Observed;
  onMap: (map: naver.maps.Map) => void;
}) {
  const [reported, setReported] = useState<naver.maps.Coord | null>(null);
  const debounceRef = useRef<number | null>(null);
  const given = config.center ? toCoord(config.center) : null;
  const center = given ?? reported ?? toCoord(INITIAL_CENTER);
  const onCenterChanged = (() => {
    switch (config.mode) {
      case 'controlled':
        return setReported;
      case 'rounded':
        return (c: naver.maps.Coord) => {
          const ll = c as naver.maps.LatLng;
          setReported({
            lat: Number(ll.lat().toFixed(config.roundDigits ?? 4)),
            lng: Number(ll.lng().toFixed(config.roundDigits ?? 4)),
          } as unknown as naver.maps.Coord);
        };
      case 'debounced':
        return (c: naver.maps.Coord) => {
          if (debounceRef.current) window.clearTimeout(debounceRef.current);
          debounceRef.current = window.setTimeout(() => setReported(c), 300);
        };
      default:
        return undefined;
    }
  })();

  return (
    <NaverMap
      key={config.mapKey}
      ref={(map: naver.maps.Map | null) => {
        if (map) onMap(map);
      }}
      center={center}
      zoom={config.zoom ?? INITIAL_ZOOM}
      zoomControl={config.zoomControl}
      gl={config.gl}
      cursor={config.mapCursor}
      {...(config.projectionlessMapType
        ? { mapTypes: projectionlessRegistry(), mapTypeId: 'mine' }
        : {})}
      {...(config.mapTypesInline
        ? {
            mapTypes: new naver.maps.MapTypeRegistry(
              { normal: naver.maps.NaverStyleMapTypeOptions.getNormalMap() },
              'normal',
            ),
          }
        : {})}
      {...(config.inlineOptions
        ? {
            padding: { top: 10, right: 10, bottom: 10, left: 10 },
            zoomControlOptions: { position: 1 },
          }
        : {})}
      onZoomChanged={(zoom: number) => observed.zoomReports.push(zoom)}
      onZoomstart={() => observed.calls.push('onZoomstart')}
      onZoomend={() => observed.calls.push('onZoomend')}
      onCenterChanged={onCenterChanged}
    >
      <KvoProbe observed={observed} />
      {config.autoResize && <AutoResize />}
      {config.suspendKey !== undefined && <Suspender k={config.suspendKey} />}
      {config.marker && (
        <Activity mode={config.markerActivity ?? 'visible'}>
          <Marker
            ref={(marker: naver.maps.Marker | null) => {
              observed.recordMarker(marker);
            }}
            position={toCoord(INITIAL_CENTER)}
            clickable={config.markerClickable}
            draggable={config.markerDraggable}
            {...(config.markerAnimation !== undefined
              ? {
                  animation:
                    config.markerAnimation as naver.maps.Animation | null,
                }
              : {})}
            {...(config.markerInlineIcon
              ? {
                  icon: {
                    content:
                      '<div style="width:20px;height:20px;background:#f00"></div>',
                    anchor: new naver.maps.Point(10, 10),
                  },
                }
              : {})}
            onClick={() => observed.recordMarkerClick()}
          />
        </Activity>
      )}
      {config.drawingMode !== undefined && (
        <DrawingManager
          ref={(o: naver.maps.drawing.DrawingManager | null) =>
            observed.recordDrawingManager(o)
          }
          drawingMode={config.drawingMode as naver.maps.drawing.DrawingMode}
          onDrawingAdded={() => observed.recordDrawingAdded()}
        />
      )}
      {config.dotMapFill && (
        <DotMap
          ref={(o: naver.maps.visualization.DotMap | null) =>
            observed.recordOverlay('dotMap', o)
          }
          data={HEAT_POINTS}
          radius={12}
          fillColor={config.dotMapFill}
        />
      )}
      {config.heatMapOpacity !== undefined && (
        <HeatMap
          ref={(o: naver.maps.visualization.HeatMap | null) =>
            observed.recordOverlay('heatMap', o)
          }
          data={config.heatMapWeighted ? HEAT_WEIGHTED : HEAT_POINTS}
          opacity={config.heatMapOpacity}
          radius={20}
        />
      )}
      {config.geoJsonFill && (
        <GeoJson
          data={CENTER_SQUARE}
          style={{
            fillColor: config.geoJsonFill,
            fillOpacity: 0.3,
            clickable: true,
          }}
          onClick={(e) => {
            if (e.feature?.getProperty('id') === 'center')
              observed.recordGeoJsonClick();
          }}
        />
      )}
      {config.kml && <Kml data={xml(KML_TEXT[config.kml])} />}
      {config.gpx && <Gpx data={xml(GPX_TEXT)} />}
      {config.editablePolygon && (
        <Polygon
          ref={(o: naver.maps.Polygon | null) => observed.recordPolygon(o)}
          defaultPaths={EDITABLE_PATHS}
          editable
          fillColor="#f00"
          fillOpacity={0.2}
        />
      )}
      {config.customControlPosition !== undefined && (
        <CustomControl
          ref={(o: naver.maps.CustomControl | null) =>
            observed.recordControl(o)
          }
          position={config.customControlPosition as naver.maps.Position}
        >
          <button type="button">처음 위치</button>
        </CustomControl>
      )}
      {config.labelLayer && (
        <LabelLayer
          ref={(o: naver.maps.Layer | null) =>
            observed.recordOverlay('label', o)
          }
        />
      )}
      {config.tileGridZIndex !== undefined && (
        <Layer
          ref={(o: naver.maps.Layer | null) => {
            observed.recordOverlay('tileGrid', o);
            if (o) observed.layers.add(o);
          }}
          name="tileGrid"
          mapTypes={tileGridType()}
          zIndex={config.tileGridZIndex}
        />
      )}
      {config.flightSpot && (
        <FlightSpot
          ref={(o: naver.maps.FlightSpot | null) =>
            observed.recordOverlay(
              'flightSpot',
              o as unknown as { getMap(): unknown },
            )
          }
        />
      )}
      {config.bicycleLayer && (
        <BicycleLayer
          ref={(o: naver.maps.Layer | null) =>
            observed.recordOverlay('bicycle', o)
          }
        />
      )}
      {config.groundOverlayUrl && (
        <GroundOverlay
          ref={(o: naver.maps.GroundOverlay | null) =>
            observed.recordGroundOverlay(o)
          }
          url={config.groundOverlayUrl}
          bounds={{ south: 37.56, west: 126.97, north: 37.57, east: 126.99 }}
        />
      )}
      <Activity mode={config.overlaysActivity ?? 'visible'}>
        {config.polyline && (
          <Polyline
            ref={(o: naver.maps.Polyline | null) =>
              observed.recordOverlay('polyline', o)
            }
            path={
              config.polylineInline
                ? STABLE_PATH.map((p) => ({ ...p }))
                : STABLE_PATH
            }
          />
        )}
        {config.circle && (
          <Circle
            ref={(o: naver.maps.Circle | null) =>
              observed.recordOverlay('circle', o)
            }
            center={toCoord(INITIAL_CENTER)}
            radius={300}
            fillColor="#007EEA"
            fillOpacity={0.3}
            clickable={config.circleClickable}
            onClick={() => observed.recordCircleClick()}
          />
        )}
        {config.infoWindow && (
          <InfoWindow
            ref={(o: naver.maps.InfoWindow | null) =>
              observed.recordOverlay('infoWindow', o)
            }
            open
            content="info"
            anchor={toCoord(INITIAL_CENTER)}
            onOpen={() => observed.calls.push('infoWindowOpen')}
            onClose={() => observed.calls.push('infoWindowClose')}
          />
        )}
      </Activity>
    </NaverMap>
  );
}

/** 앱을 올리고 드라이버가 쓸 조작을 돌려준다. */
export async function mountApp(host: HTMLElement, initial: AppConfig) {
  const ncpKeyId = initial.ncpKeyId ?? NCP_KEY_ID;
  const maps = await loadScript({
    ncpKeyId,
    submodules: initial.submodules as Submodule[] | undefined,
  });
  const observed: Observed = {
    calls: [],
    events: [],
    zoomReports: [],
    kvo: { zoom: 0, lat: 0 },
    markerClicks: 0,
    circleClicks: 0,
    marker: null,
    overlays: {},
    drawingManager: null,
    recordDrawingManager(o) {
      if (o) observed.drawingManager = o;
    },
    drawingAdded: 0,
    recordDrawingAdded() {
      observed.drawingAdded += 1;
    },
    geoJsonClicks: 0,
    recordGeoJsonClick() {
      observed.geoJsonClicks += 1;
    },
    control: null,
    recordControl(o) {
      if (o) observed.control = o;
    },
    groundOverlays: new Set(),
    polygon: null,
    recordPolygon(o) {
      if (o) observed.polygon = o;
    },
    layers: new Set(),
    recordGroundOverlay(o) {
      if (o) observed.groundOverlays.add(o);
    },
    recordOverlay(name, o) {
      if (o) observed.overlays[name] = o;
    },
    recordMarker(marker) {
      // ref 가 떨어져도(Activity 로 숨김, 언마운트) 마지막 인스턴스를 계속 본다.
      if (marker) observed.marker = marker;
    },
    recordCircleClick() {
      observed.circleClicks += 1;
    },
    recordKvo(zoom, lat) {
      observed.kvo = { zoom, lat };
    },
    recordMarkerClick() {
      observed.markerClicks += 1;
    },
  };
  observe(maps.Polyline.prototype, OBSERVED_SHAPE_METHODS, observed.calls);
  observe(maps.Marker.prototype, OBSERVED_MARKER_METHODS, observed.calls);

  let map: naver.maps.Map | undefined;
  let mapId = 0;
  let initialized = false;
  const onMap = (next: naver.maps.Map) => {
    if (map === next) return;
    map = next;
    mapId += 1;
    // GL 서브모듈의 지도는 카메라 메서드를 자기 클래스에 따로 둔다. Map.prototype 을 감싸면
    // GL 에서 호출을 못 본다. 만든 인스턴스를 직접 감싼다.
    observe(next, OBSERVED_METHODS, observed.calls);
    initialized = false;
    maps.Event.once(next, 'init', () => {
      initialized = true;
    });
    for (const event of EVENTS) {
      maps.Event.addListener(next, event, () => observed.events.push(event));
    }
  };

  const root = createRoot(host);
  let config = initial;
  let authFailures = 0;
  const render = () => {
    const tree = (
      <NavermapsProvider
        ncpKeyId={ncpKeyId}
        submodules={config.submodules as Submodule[] | undefined}
        onAuthFailure={() => {
          authFailures += 1;
        }}
      >
        <Container
          style={{
            width: `${config.containerWidth ?? 600}px`,
            height: '400px',
          }}
        >
          <Activity mode={config.mapActivity ?? 'visible'}>
            <MapUnderTest config={config} observed={observed} onMap={onMap} />
          </Activity>
        </Container>
      </NavermapsProvider>
    );
    return config.strict ? <StrictMode>{tree}</StrictMode> : tree;
  };
  root.render(render());

  return {
    ready: () => map !== undefined,
    /** NavermapsProvider 의 onAuthFailure 를 받은 수 */
    authFailures: () => authFailures,
    /** 스타일 메타데이터를 받아 지도가 init 까지 끝났는가 */
    initialized: () => initialized,
    setProps(props: Partial<AppConfig>) {
      config = { ...config, ...props };
      flushSync(() => root.render(render()));
    },
    call(method: string, args: unknown[]) {
      const decoded = args.map((a) =>
        Array.isArray(a) ? new maps.LatLng(a[0], a[1]) : a,
      );
      (map as unknown as Record<string, (...a: unknown[]) => void>)[method](
        ...decoded,
      );
    },
    unmount() {
      root.unmount();
    },
    /** geocoder 서브모듈로 주소를 찾아 첫 도로명 주소를 돌려준다. 실패하면 에러 메시지. */
    async geocode(query: string): Promise<string> {
      try {
        const result = await geocode(maps, { query });
        return result.addresses[0]?.roadAddress ?? '';
      } catch (e) {
        return `error: ${(e as Error).message}`;
      }
    },
    async reverseGeocode(lat: number, lng: number): Promise<string> {
      try {
        const result = await reverseGeocode(maps, {
          coords: { lat, lng },
          orders: 'roadaddr',
        });
        return result.results[0]?.land?.name ?? '';
      } catch (e) {
        return `error: ${(e as Error).message}`;
      }
    },
    resetObserved() {
      if (map) observe(map, OBSERVED_METHODS, observed.calls);
      observed.calls.length = 0;
      observed.events.length = 0;
      observed.zoomReports.length = 0;
    },
    read(): TraceFrame {
      // GL 서브모듈은 준비되면서 인스턴스 메서드를 새로 단다. 그러면 감싼 것이 사라지므로
      // 읽을 때마다 다시 감싼다. 이번 프레임에 이미 바뀐 호출은 못 보지만 GL 준비는 mount 안에서 끝난다.
      observe(map!, OBSERVED_METHODS, observed.calls);
      // 투영이 없는 사용자 지도 유형에서는 getCenter() 가 Point 다. 그때는 [y, x].
      const c = map!.getCenter();
      const center: LL =
        'lat' in c && typeof c.lat === 'function'
          ? [c.lat(), (c as naver.maps.LatLng).lng()]
          : [(c as naver.maps.Point).y, (c as naver.maps.Point).x];
      return {
        center,
        zoom: map!.getZoom(),
        events: observed.events.splice(0),
        calls: observed.calls.splice(0),
        zoomReports: observed.zoomReports.splice(0),
        controls: controlCount(map!),
        attached: map!.getPanes().overlayLayer.isConnected,
        mapWidth: map!.getSize().width,
        kvoZoom: observed.kvo.zoom,
        kvoLat: observed.kvo.lat,
        markerClicks: observed.markerClicks,
        circleClicks: observed.circleClicks,
        renderMode: (map as unknown as { get(k: string): number }).get(
          'renderMode',
        ),
        mapId,
        markerOnMap: observed.marker ? observed.marker.getMap() === map : null,
        heatMapOpacity:
          (
            observed.overlays.heatMap as unknown as {
              getOptions?: (k: string) => number;
            }
          )?.getOptions?.('opacity') ?? null,
        drawings: observed.drawingManager
          ? Object.keys(observed.drawingManager.getDrawings() ?? {}).length
          : null,
        drawingAdded: observed.drawingAdded,
        dataFeatures: map!.data.getAllFeature().length,
        dataFillColor: (() => {
          const overlay = map!.data.getAllFeature()[0]?.getOverlays()[0] as
            | { getOptions?: (k: string) => unknown }
            | undefined;
          return (
            (overlay?.getOptions?.('fillColor') as string | undefined) ?? null
          );
        })(),
        geoJsonClicks: observed.geoJsonClicks,
        customControlAt: (() => {
          const el = observed.control?.getElement();
          if (!el) return null;
          for (const [pos, arr] of Object.entries(map!.controls ?? {})) {
            const items =
              (arr as { getArray?: () => unknown[] })?.getArray?.() ?? [];
            if (items.includes(el)) return Number(pos);
          }
          return null;
        })(),
        customControlText: observed.control?.getElement().textContent ?? null,
        groundOverlays: observed.groundOverlays.size,
        layersCreated: observed.layers.size,
        tileGridCells: document.querySelectorAll('.tile-grid').length,
        overlaysOnMap: Object.entries(observed.overlays)
          .filter(([, o]) => o.getMap() === map)
          .map(([name]) => name)
          .toSorted(),
        polygonFirst: observed.polygon
          ? (() => {
              const paths = observed.polygon.getPaths() as unknown as {
                getAt(i: number): { getAt(i: number): naver.maps.LatLng };
              };
              const p = paths.getAt(0).getAt(0);
              return [p.lat(), p.lng()] as LL;
            })()
          : null,
        markerAnimation: observed.marker
          ? ((observed.marker.getAnimation() as number | null) ?? null)
          : null,
        mapCursor: (() => {
          const rect = map!.getElement().getBoundingClientRect();
          const el = document.elementFromPoint(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
          );
          return el ? getComputedStyle(el).cursor : '';
        })(),
        markerPosition: observed.marker
          ? (() => {
              const p = observed.marker.getPosition() as naver.maps.LatLng;
              return [p.lat(), p.lng()] as LL;
            })()
          : null,
      };
    },
  };
}

export type MountedApp = Awaited<ReturnType<typeof mountApp>>;

/**
 * 거리뷰만 올린다. 시나리오 trace 와 따로, panorama.spec.ts 가 쓴다.
 * events 에 'pano_changed:<panoId>', 'pano_status:<status>', 'pov_changed' 를 쌓는다.
 */
export async function mountPanorama(
  host: HTMLElement,
  initial: { position: LL; pan?: number; marker?: LL; infoWindow?: boolean },
) {
  const maps = await loadScript({
    ncpKeyId: NCP_KEY_ID,
    submodules: ['panorama'],
  });
  const events: string[] = [];
  let panorama: naver.maps.Panorama | null = null;
  let marker: naver.maps.Marker | null = null;
  let infoWindow: naver.maps.InfoWindow | null = null;
  let pan = initial.pan ?? 0;
  const root = createRoot(host);
  const render = () =>
    root.render(
      <NavermapsProvider ncpKeyId={NCP_KEY_ID} submodules={['panorama']}>
        <Container style={{ width: '600px', height: '400px' }}>
          <Panorama
            ref={(p: naver.maps.Panorama | null) => {
              if (p) panorama = p;
            }}
            position={toCoord(initial.position)}
            pov={{ pan, tilt: 0, fov: 100 }}
            onPanoChanged={(id) => events.push(`pano_changed:${id}`)}
            onPanoStatus={(status) => events.push(`pano_status:${status}`)}
            onPovChanged={() => events.push('pov_changed')}
            onInit={() => events.push('init')}
          >
            {initial.marker && (
              <Marker
                ref={(m: naver.maps.Marker | null) => {
                  if (m) marker = m;
                }}
                position={toCoord(initial.marker)}
              />
            )}
            {initial.marker && initial.infoWindow && (
              <InfoWindow
                ref={(o: naver.maps.InfoWindow | null) => {
                  if (o) infoWindow = o;
                }}
                open
                content="here"
                anchor={toCoord(initial.marker)}
                onOpen={() => events.push('infoWindowOpen')}
              />
            )}
          </Panorama>
        </Container>
      </NavermapsProvider>,
    );
  render();
  void maps;
  return {
    events: () => events.slice(),
    pan: () => (panorama as naver.maps.Panorama | null)?.getPov().pan ?? null,
    /** 튜토리얼처럼 거리뷰 투영으로 Marker 쪽을 바라본다. 화면 확인용. */
    lookAtMarker() {
      if (!panorama || !marker) return;
      const pov = panorama
        .getProjection()
        .fromCoordToPov(marker.getPosition() as naver.maps.LatLng);
      if (pov) panorama.setPov(pov);
    },
    /** Marker 가 거리뷰에 붙었는가 */
    markerOnPano: () =>
      !!marker && (marker.getMap() as unknown) === (panorama as unknown),
    /** InfoWindow 가 거리뷰에 열렸는가 */
    infoWindowOnPano: () =>
      !!infoWindow &&
      (infoWindow.getMap() as unknown) === (panorama as unknown),
    setPan(next: number) {
      pan = next;
      flushSync(render);
    },
  };
}
