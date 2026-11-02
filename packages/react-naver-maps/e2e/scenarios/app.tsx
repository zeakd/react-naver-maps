import { StrictMode, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import {
  Container,
  Marker,
  NaverMap,
  NavermapsProvider,
} from '../../src/react-naver-maps.js';
import { loadScript } from '../../src/load-script.js';
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

type Observed = { calls: string[]; events: string[]; zoomReports: number[] };

function observeMethods(maps: typeof naver.maps, calls: string[]) {
  const proto = maps.Map.prototype as unknown as Record<
    string,
    (...args: unknown[]) => unknown
  >;
  for (const method of OBSERVED_METHODS) {
    const original = proto[method];
    if (!original) continue;
    proto[method] = function (this: unknown, ...args: unknown[]) {
      calls.push(method);
      return original.apply(this, args);
    };
  }
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
      onZoomChanged={(zoom: number) => observed.zoomReports.push(zoom)}
      onCenterChanged={config.mode === 'controlled' ? setReported : undefined}
    >
      {config.marker && (
        <Marker position={toCoord(INITIAL_CENTER)} onClick={() => {}} />
      )}
    </NaverMap>
  );
}

/** 앱을 올리고 드라이버가 쓸 조작을 돌려준다. */
export async function mountApp(host: HTMLElement, initial: AppConfig) {
  const ncpKeyId = initial.ncpKeyId ?? NCP_KEY_ID;
  const maps = await loadScript({ ncpKeyId, submodules: initial.submodules });
  const observed: Observed = { calls: [], events: [], zoomReports: [] };
  observeMethods(maps, observed.calls);

  let map: naver.maps.Map | undefined;
  const onMap = (next: naver.maps.Map) => {
    if (map === next) return;
    map = next;
    for (const event of EVENTS) {
      maps.Event.addListener(next, event, () => observed.events.push(event));
    }
  };

  const root = createRoot(host);
  let config = initial;
  const render = () => {
    const tree = (
      <NavermapsProvider ncpKeyId={ncpKeyId} submodules={config.submodules}>
        <Container style={{ width: '600px', height: '400px' }}>
          <MapUnderTest config={config} observed={observed} onMap={onMap} />
        </Container>
      </NavermapsProvider>
    );
    return config.strict ? <StrictMode>{tree}</StrictMode> : tree;
  };
  root.render(render());

  return {
    ready: () => map !== undefined,
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
      };
    },
  };
}

export type MountedApp = Awaited<ReturnType<typeof mountApp>>;
