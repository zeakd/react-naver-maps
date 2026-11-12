import {
  Fragment,
  StrictMode,
  startTransition,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import { Activity } from './activity.js';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import type { FieldKind } from '../fields.js';
import {
  CORE_FIELDS,
  type AppConfig,
  type CoreFrame,
  type LL,
  type TraceFrame,
} from '../types.js';
import { INITIAL_CENTER, INITIAL_ZOOM, NCP_KEY_ID, toCoord } from './common.js';
import { FIXTURES } from './fixtures/index.js';
import { createObserved, observe, type Observed } from './observe.js';
import {
  Container,
  geocode,
  InfoWindow,
  loadScript,
  NaverMap,
  NavermapsProvider,
  reverseGeocode,
  useKVO,
  useMap,
} from './target-imports.js';
import type { Submodule, ZoomControlOptionsProp } from '../target.js';

// 앱 코드의 구성: 이 파일은 지도 본체(center 를 내려주는 방식, 카메라 관찰, 지도 이벤트)를 맡고,
// 지도 안에 올리는 기능은 fixtures/ 의 픽스처가 렌더하고 읽는다.

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

// 투영을 생략한 사용자 지도 유형(공식 예제 tutorial-3-maptypes-basic 과 같은 모양). 한 번만 만든다.
let projectionless: naver.maps.MapTypeRegistry | null = null;
let customOnly: naver.maps.MapTypeRegistry | undefined;
/** 'custom' 하나만 든 레지스트리. 앱을 올리는 동안 같은 객체를 쓴다. */
function customOnlyRegistry(): naver.maps.MapTypeRegistry {
  customOnly ??= new naver.maps.MapTypeRegistry({
    custom: naver.maps.NaverStyleMapTypeOptions.getNormalMap(),
  });
  return customOnly;
}

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

/** 지도의 center 를 [lat, lng] 로. 투영이 없는 사용자 지도 유형에서는 getCenter() 가 Point 라 [y, x]. */
function centerOf(map: naver.maps.Map): LL {
  const c = map.getCenter();
  return 'lat' in c && typeof c.lat === 'function'
    ? [c.lat(), (c as naver.maps.LatLng).lng()]
    : [(c as naver.maps.Point).y, (c as naver.maps.Point).x];
}

/** 앱이 내려준 center 를 [lat, lng] 로. 리터럴과 LatLng 둘 다 받는다. */
function coordToLL(c: naver.maps.Coord): LL {
  const o = c as unknown as {
    lat: number | (() => number);
    lng: number | (() => number);
  };
  return typeof o.lat === 'function'
    ? [o.lat(), (o.lng as () => number)()]
    : [o.lat, o.lng as number];
}

/** 앱이 지도에 내려준 값의 기록과, 단계가 앱 상태에 쓰는 통로. mountApp 이 만든다. */
export type Feedback = {
  /** 마지막으로 커밋된 렌더에서 내려준 center·zoom prop (TraceFrame.propCenter, propZoom) */
  given(): { center: LL | null; zoom: number | null };
  setGiven(center: LL, zoom: number): void;
  /** 지도 본체가 올라와 있는 동안 상태에 쓰는 함수를 달고 뗀다. */
  attach(write: ((state: { center?: LL; zoom?: number }) => void) | null): void;
  write(state: { center?: LL; zoom?: number }): void;
};

function createFeedback(): Feedback {
  const given: { center: LL | null; zoom: number | null } = {
    center: null,
    zoom: null,
  };
  let write: Parameters<Feedback['attach']>[0] = null;
  return {
    given: () => given,
    setGiven(center, zoom) {
      given.center = center;
      given.zoom = zoom;
    },
    attach(next) {
      write = next;
    },
    write(state) {
      if (!write) throw new Error('지도 본체가 올라와 있지 않다');
      write(state);
    },
  };
}

function controlCount(map: naver.maps.Map) {
  const positions = Object.values(map.controls ?? {}) as unknown as {
    getLength?: () => number;
  }[];
  return positions.reduce((sum, p) => sum + (p?.getLength?.() ?? 0), 0);
}

/** 마지막 값만 300ms 뒤에 적용하는 예약 함수. 타이머 id 는 timer 에 둔다. */
function debouncer(timer: { id: number | null }) {
  return (apply: () => void) => {
    if (timer.id) window.clearTimeout(timer.id);
    timer.id = window.setTimeout(apply, 300);
  };
}

/**
 * mode 에 따라 onCenterChanged 로 받은 값을 상태에 넣는 핸들러. props 면 없다(상태를 갱신하지 않는다).
 * later 는 값마다 delayMs 뒤에 적용을 예약하고, debounce 는 마지막 값만 300ms 뒤에 적용한다.
 */
function centerReporter(
  config: AppConfig,
  setReported: (c: naver.maps.Coord) => void,
  later: (apply: () => void) => void,
  debounce: (apply: () => void) => void,
): ((c: naver.maps.Coord) => void) | undefined {
  switch (config.mode) {
    case 'controlled':
      return setReported;
    case 'rounded':
      return (c) => {
        const ll = c as naver.maps.LatLng;
        setReported({
          lat: Number(ll.lat().toFixed(config.roundDigits ?? 4)),
          lng: Number(ll.lng().toFixed(config.roundDigits ?? 4)),
        } as unknown as naver.maps.Coord);
      };
    case 'debounced':
      return (c) => debounce(() => setReported(c));
    case 'delayed':
      return (c) => later(() => setReported(c));
    default:
      return undefined;
  }
}

/** 두 번째 지도(secondMap)의 인스턴스를 받는 통로. mountApp 이 만든다. */
type Second = {
  onMap(map: naver.maps.Map): void;
  onInfoWindow(infoWindow: naver.maps.InfoWindow): void;
};

/**
 * 첫 지도 옆의 두 번째 지도. 첫 지도와 같은 mode 로 center 를 되먹이고 자기 InfoWindow 하나를 연다.
 * 첫 지도의 픽스처(FIXTURES)와 단계는 여기에 닿지 않는다.
 */
function SecondMap({ config, second }: { config: AppConfig; second: Second }) {
  const [reported, setReported] = useState<naver.maps.Coord | null>(null);
  const [debounceTimer] = useState<{ id: number | null }>({ id: null });
  const [timers] = useState(() => new Set<number>());
  useEffect(
    () => () => {
      for (const id of timers) window.clearTimeout(id);
    },
    [timers],
  );
  const later = (apply: () => void) => {
    timers.add(window.setTimeout(apply, config.delayMs ?? 50));
  };
  const debounce = debouncer(debounceTimer);
  const given = config.secondMapCenter ? toCoord(config.secondMapCenter) : null;
  return (
    <NaverMap
      ref={(map: naver.maps.Map | null) => {
        if (map) second.onMap(map);
      }}
      center={given ?? reported ?? toCoord(INITIAL_CENTER)}
      zoom={config.zoom ?? INITIAL_ZOOM}
      onCenterChanged={centerReporter(config, setReported, later, debounce)}
    >
      <InfoWindow
        ref={(o: naver.maps.InfoWindow | null) => {
          if (o) second.onInfoWindow(o);
        }}
        open
        content="info-second"
        anchor={toCoord(INITIAL_CENTER)}
      />
    </NaverMap>
  );
}

function MapUnderTest({
  config,
  observed,
  probes,
  feedback,
  onMap,
}: {
  config: AppConfig;
  observed: Observed;
  feedback: Feedback;
  /** FIXTURES 와 같은 순서의 픽스처별 관찰 상태 */
  probes: unknown[];
  onMap: (map: naver.maps.Map) => void;
}) {
  const [reported, setReported] = useState<naver.maps.Coord | null>(null);
  const [reportedZoom, setReportedZoom] = useState<number | null>(null);
  const [debounceTimer] = useState<{ id: number | null }>({ id: null });
  const [timers] = useState(() => new Set<number>());
  const delayMs = config.delayMs ?? 50;
  // 값마다 따로 예약한다(마지막 값만 남기는 debounced 와 다르다). 가상 시계가 결정적으로 돌린다.
  const later = (apply: () => void) => {
    timers.add(window.setTimeout(apply, delayMs));
  };
  useEffect(() => {
    feedback.attach((state) => {
      flushSync(() => {
        if (state.center)
          setReported(toCoord(state.center) as unknown as naver.maps.Coord);
        if (state.zoom !== undefined) setReportedZoom(state.zoom);
      });
    });
    return () => {
      feedback.attach(null);
      for (const id of timers) window.clearTimeout(id);
    };
  }, [feedback, timers]);
  const given = config.center ? toCoord(config.center) : null;
  const center = given ?? reported ?? toCoord(INITIAL_CENTER);
  const zoom = config.zoom ?? reportedZoom ?? INITIAL_ZOOM;
  // 커밋마다 기록한다.
  const givenCenter = coordToLL(center as unknown as naver.maps.Coord);
  useLayoutEffect(() => {
    feedback.setGiven(givenCenter, zoom);
  });
  const onZoomReported = (z: number) => {
    observed.zoomReports.push(z);
    if (config.zoomMode === 'controlled') setReportedZoom(z);
    else if (config.zoomMode === 'delayed') later(() => setReportedZoom(z));
  };
  const debounce = debouncer(debounceTimer);
  const onCenterChanged = centerReporter(config, setReported, later, debounce);

  return (
    <NaverMap
      key={config.mapKey}
      ref={(map: naver.maps.Map | null) => {
        if (map) onMap(map);
      }}
      center={center}
      zoom={zoom}
      zoomControl={config.zoomControl}
      gl={config.gl}
      cursor={config.mapCursor}
      {...(config.projectionlessMapType
        ? { mapTypes: projectionlessRegistry(), mapTypeId: 'mine' }
        : {})}
      {...(config.customMapTypes
        ? { mapTypes: customOnlyRegistry(), mapTypeId: 'custom' }
        : {})}
      {...(config.mapTypesInline
        ? {
            mapTypes: new naver.maps.MapTypeRegistry(
              { normal: naver.maps.NaverStyleMapTypeOptions.getNormalMap() },
              'normal',
            ),
          }
        : {})}
      {...(config.zoomControlOptionsNamed
        ? {
            zoomControlOptions: {
              ...config.zoomControlOptionsNamed,
            } as ZoomControlOptionsProp,
          }
        : {})}
      {...(config.inlineOptions
        ? {
            padding: { top: 10, right: 10, bottom: 10, left: 10 },
            zoomControlOptions: { position: 1 },
          }
        : {})}
      onZoomChanged={onZoomReported}
      onZoomstart={() => observed.propCalls.push('onZoomstart')}
      onZoomend={() => observed.propCalls.push('onZoomend')}
      onCenterChanged={onCenterChanged}
    >
      <KvoProbe observed={observed} />
      {/* 렌더 순서가 effect 순서, 곧 SDK 호출 순서다. FIXTURES 의 순서를 따른다. */}
      {/* FIXTURES 는 고정된 목록이라 인덱스 키가 안전하다. */}
      {FIXTURES.map((fixture, i) => (
        // oxlint-disable-next-line react/no-array-index-key
        <Fragment key={i}>
          {fixture.render(config, probes[i], observed)}
        </Fragment>
      ))}
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
  const observed = createObserved();
  const feedback = createFeedback();
  const probes = FIXTURES.map((fixture) => fixture.probe?.());
  let secondMap: naver.maps.Map | null = null;
  let secondInfoWindow: naver.maps.InfoWindow | null = null;
  const second: Second = {
    onMap: (next) => {
      secondMap = next;
    },
    onInfoWindow: (next) => {
      secondInfoWindow = next;
    },
  };
  FIXTURES.forEach((fixture, i) => fixture.setup?.(maps, probes[i], observed));

  let map: naver.maps.Map | undefined;
  let mapId = 0;
  let initialized = false;
  let mapSetOptionsCalls = 0;
  const onMap = (next: naver.maps.Map) => {
    if (map === next) return;
    map = next;
    mapId += 1;
    // GL 서브모듈의 지도는 카메라 메서드를 자기 클래스에 따로 둔다. Map.prototype 을 감싸면
    // GL 에서 호출을 못 본다. 만든 인스턴스를 직접 감싼다.
    observe(next, OBSERVED_METHODS, observed.calls);
    if (initial.countMapSetOptions) {
      const original = next.setOptions.bind(next) as (...a: unknown[]) => void;
      (
        next as unknown as { setOptions: (...a: unknown[]) => void }
      ).setOptions = (...a: unknown[]) => {
        mapSetOptionsCalls += 1;
        original(...a);
      };
    }
    initialized = false;
    maps.Event.once(next, 'init', () => {
      initialized = true;
    });
    for (const event of EVENTS) {
      maps.Event.addListener(next, event, () => observed.events.push(event));
    }
  };

  // pageerror 와 console.error 를 프레임 단위로 모은다(read 가 비운다).
  const onWindowError = (e: ErrorEvent) =>
    observed.errors.push(`error: ${e.message}`);
  window.addEventListener('error', onWindowError);
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    observed.errors.push(
      args
        .map((a) =>
          a instanceof Error ? `${a.name}: ${a.message}` : String(a),
        )
        .join(' '),
    );
    originalConsoleError.apply(console, args);
  };

  const root = createRoot(host);
  let config = initial;
  /** 마지막으로 읽은 프레임. 지도를 내린 동안은 이 값에 새 이벤트·에러만 얹어 돌려준다. */
  let lastFrame: TraceFrame | undefined;
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
        <div style={config.secondMap ? { display: 'flex' } : undefined}>
          <Container
            style={{
              width: `${config.containerWidth ?? 600}px`,
              height: '400px',
            }}
          >
            <Activity mode={config.mapActivity ?? 'visible'}>
              {config.showMap !== false && (
                <MapUnderTest
                  config={config}
                  observed={observed}
                  probes={probes}
                  feedback={feedback}
                  onMap={onMap}
                />
              )}
            </Activity>
          </Container>
          {config.secondMap && (
            <Container style={{ width: '400px', height: '400px' }}>
              <SecondMap config={config} second={second} />
            </Container>
          )}
        </div>
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
    setProps(props: Partial<AppConfig>, transition?: boolean) {
      config = { ...config, ...props };
      if (transition) startTransition(() => root.render(render()));
      else flushSync(() => root.render(render()));
    },
    /** 좌표가 지도 element 안에서 놓인 화면 자리 [x, y]. 컨테이너가 화면 왼쪽 위에 붙어 있다고 본다. */
    pointOf(lat: number, lng: number): [number, number] {
      const p = map!
        .getProjection()
        .fromCoordToOffset(new maps.LatLng(lat, lng)) as naver.maps.Point;
      return [p.x, p.y];
    },
    /** 되먹임 상태(reported center·zoom)에 바로 쓴다. 이후 되먹임이 덮을 수 있다. */
    setState(state: { center?: LL; zoom?: number }) {
      feedback.write(state);
    },
    /** 키보드 단계를 위해 지도 요소에 포커스를 둔다. */
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
      window.removeEventListener('error', onWindowError);
      console.error = originalConsoleError;
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
    /** 프레임 필드마다 비교 방법. 실행이 보고서에 fields.json 으로 붙인다(scenarios.spec.ts). */
    fields(): Record<string, FieldKind> {
      return Object.assign(
        {},
        CORE_FIELDS,
        ...FIXTURES.map((fixture) => fixture.fields),
      );
    },
    resetObserved() {
      if (map) observe(map, OBSERVED_METHODS, observed.calls);
      observed.calls.length = 0;
      observed.events.length = 0;
      observed.zoomReports.length = 0;
      observed.errors.length = 0;
    },
    read(): TraceFrame {
      if (config.showMap === false) {
        // 내려간 지도는 읽지 않는다(없어진 인스턴스의 값은 믿을 수 없다). 마지막 값에 새 기록만 얹는다.
        if (!lastFrame) throw new Error('지도를 읽은 적이 없다');
        return (lastFrame = {
          ...lastFrame,
          events: observed.events.splice(0),
          calls: observed.calls.splice(0),
          propCalls: observed.propCalls.splice(0),
          zoomReports: observed.zoomReports.splice(0),
          errors: observed.errors.splice(0),
          attached: false,
          mapVisible: false,
        });
      }
      // GL 서브모듈은 준비되면서 인스턴스 메서드를 새로 단다. 그러면 감싼 것이 사라지므로
      // 읽을 때마다 다시 감싼다. 이번 프레임에 이미 바뀐 호출은 못 보지만 GL 준비는 mount 안에서 끝난다.
      observe(map!, OBSERVED_METHODS, observed.calls);
      const center = centerOf(map!);
      const core: CoreFrame = {
        center,
        zoom: map!.getZoom(),
        ...zoomControlNames(maps, map!),
        mapSetOptionsCalls: initial.countMapSetOptions
          ? mapSetOptionsCalls
          : null,
        // 드라이버가 CDP 로 채운다(playwright-driver.ts frame).
        scriptMs: null,
        events: observed.events.splice(0),
        calls: observed.calls.splice(0),
        propCalls: observed.propCalls.splice(0),
        zoomReports: observed.zoomReports.splice(0),
        propCenter: feedback.given().center,
        propZoom: feedback.given().zoom,
        controls: controlCount(map!),
        attached: map!.getPanes().overlayLayer.isConnected,
        mapWidth: map!.getSize().width,
        kvoZoom: observed.kvo.zoom,
        kvoLat: observed.kvo.lat,
        renderMode: (map as unknown as { get(k: string): number }).get(
          'renderMode',
        ),
        mapTypeId: map!.getMapTypeId(),
        mapId,
        overlaysOnMap: Object.entries(observed.overlays)
          .filter(([, o]) => o.getMap() === map)
          .map(([name]) => name)
          .toSorted(),
        mapVisible: (() => {
          const el = map!.getElement();
          const rect = el.getBoundingClientRect();
          return el.checkVisibility() && rect.width > 0 && rect.height > 0;
        })(),
        errors: observed.errors.splice(0),
        secondCenter:
          config.secondMap && secondMap ? centerOf(secondMap) : null,
        secondInfoWindowOpen:
          config.secondMap && secondInfoWindow && secondMap
            ? secondInfoWindow.getMap() === secondMap
            : null,
        mapCursor: (() => {
          const rect = map!.getElement().getBoundingClientRect();
          const el = document.elementFromPoint(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
          );
          return el ? getComputedStyle(el).cursor : '';
        })(),
      };
      // 이벤트·호출을 비운 뒤에 픽스처가 읽는다(읽기는 지도 메서드 호출을 만들지 않는다).
      return (lastFrame = Object.assign(
        core,
        ...FIXTURES.map((fixture, i) =>
          fixture.read?.(map!, probes[i], observed),
        ),
      ) as TraceFrame);
    },
  };
}

export type MountedApp = Awaited<ReturnType<typeof mountApp>>;

/** SDK 표에서 값의 이름을 거꾸로 찾는다. */
function nameOf(table: object, value: unknown): string | null {
  const hit = Object.entries(table).find(
    ([k, v]) => v === value && !/^\d+$/.test(k),
  );
  return hit ? hit[0] : null;
}

function zoomControlNames(maps: typeof naver.maps, map: naver.maps.Map) {
  const o = (map as unknown as { getOptions(k: string): unknown }).getOptions(
    'zoomControlOptions',
  ) as { position?: number; style?: number } | undefined;
  return {
    zoomControlPositionName: o ? nameOf(maps.Position, o.position) : null,
    zoomControlStyleName: o ? nameOf(maps.ZoomControlStyle, o.style) : null,
  };
}
