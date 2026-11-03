import { StrictMode, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import {
  Circle,
  Container,
  InfoWindow,
  loadScript,
  Marker,
  NaverMap,
  NavermapsProvider,
  Polyline,
  useAutoResize,
  useKVO,
  useMap,
} from './target.js';
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
  recordCircleClick: () => void;
  recordKvo: (zoom: number, lat: number) => void;
  recordMarkerClick: () => void;
};

function observe(prototype: object, methods: string[], calls: string[]) {
  const proto = prototype as Record<string, (...args: unknown[]) => unknown>;
  for (const method of methods) {
    const original = proto[method];
    if (!original) continue;
    proto[method] = function (this: unknown, ...args: unknown[]) {
      calls.push(method);
      return original.apply(this, args);
    };
  }
}

function AutoResize() {
  useAutoResize(useMap());
  return null;
}

function KvoProbe({ observed }: { observed: Observed }) {
  const map = useMap();
  const zoom = useKVO<number>(map, 'zoom');
  const center = useKVO<naver.maps.LatLng>(map, 'center');
  observed.recordKvo(zoom, center.lat());
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
  const given = config.center ? toCoord(config.center) : null;
  const center = given ?? reported ?? toCoord(INITIAL_CENTER);

  return (
    <NaverMap
      key={config.mapKey}
      ref={(map: naver.maps.Map | null) => {
        if (map) onMap(map);
      }}
      center={center}
      zoom={config.zoom ?? INITIAL_ZOOM}
      zoomControl={config.zoomControl}
      {...(config.inlineOptions
        ? {
            padding: { top: 10, right: 10, bottom: 10, left: 10 },
            zoomControlOptions: { position: 1 },
          }
        : {})}
      onZoomChanged={(zoom: number) => observed.zoomReports.push(zoom)}
      onCenterChanged={config.mode === 'controlled' ? setReported : undefined}
    >
      <KvoProbe observed={observed} />
      {config.autoResize && <AutoResize />}
      {config.marker && (
        <Marker
          position={toCoord(INITIAL_CENTER)}
          clickable={config.markerClickable}
          onClick={() => observed.recordMarkerClick()}
        />
      )}
      {config.polyline && <Polyline path={STABLE_PATH} />}
      {config.circle && (
        <Circle
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
          open
          content="info"
          anchor={toCoord(INITIAL_CENTER)}
          onOpen={() => observed.calls.push('infoWindowOpen')}
          onClose={() => observed.calls.push('infoWindowClose')}
        />
      )}
    </NaverMap>
  );
}

/** 앱을 올리고 드라이버가 쓸 조작을 돌려준다. */
export async function mountApp(host: HTMLElement, initial: AppConfig) {
  const ncpKeyId = initial.ncpKeyId ?? NCP_KEY_ID;
  const maps = await loadScript({ ncpKeyId, submodules: initial.submodules });
  const observed: Observed = {
    calls: [],
    events: [],
    zoomReports: [],
    kvo: { zoom: 0, lat: 0 },
    markerClicks: 0,
    circleClicks: 0,
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
  observe(maps.Map.prototype, OBSERVED_METHODS, observed.calls);
  observe(maps.Polyline.prototype, OBSERVED_SHAPE_METHODS, observed.calls);

  let map: naver.maps.Map | undefined;
  let initialized = false;
  const onMap = (next: naver.maps.Map) => {
    if (map === next) return;
    map = next;
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
  const render = () => {
    const tree = (
      <NavermapsProvider ncpKeyId={ncpKeyId} submodules={config.submodules}>
        <Container
          style={{
            width: `${config.containerWidth ?? 600}px`,
            height: '400px',
          }}
        >
          <MapUnderTest config={config} observed={observed} onMap={onMap} />
        </Container>
      </NavermapsProvider>
    );
    return config.strict ? <StrictMode>{tree}</StrictMode> : tree;
  };
  root.render(render());

  return {
    ready: () => map !== undefined,
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
    resetObserved() {
      observed.calls.length = 0;
      observed.events.length = 0;
      observed.zoomReports.length = 0;
    },
    read(): TraceFrame {
      const center = map!.getCenter() as naver.maps.LatLng;
      return {
        center: [center.lat(), center.lng()],
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
      };
    },
  };
}

export type MountedApp = Awaited<ReturnType<typeof mountApp>>;
