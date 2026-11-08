/**
 * 단위 테스트가 쓰는 naver.maps 가짜 하나. 라이브러리가 기대는 SDK 성질만 담는다.
 *
 * - KVO: `get`/`set`, `set` 이 `${key}_changed` 를 낸다, `setOptions`/`getOptions`, 클래스마다 있는
 *   이름 있는 setter·getter(`setPosition` → `set('position')`), 정체 있는 객체 표시(`bindTo`).
 * - Event: `addListener`/`removeListener`/`clearInstanceListeners`/`trigger`.
 * - LatLng·Point: 값 객체(`lat()`/`lng()`, `x`/`y`, `equals`, `clone`).
 * - 오버레이: `setMap`/`getMap`. InfoWindow 는 `open(map, anchor)` 이 지도에 붙이고 'open' 을, `close()` 가
 *   떼고 'close' 를 낸다.
 *
 * 이 성질이 실제 SDK 와 같은지는 `sdk-contract.ts` 가 이 가짜와 실제 SDK
 * (`e2e/scenarios/sdk-contract.spec.ts`)에서 함께 확인한다. 클래스마다 적은 setter·getter 가 실제
 * 클래스에 있는지도 거기서 본다.
 *
 * 테스트는 SDK 를 거쳐 확인한다: 이벤트는 `fire`(= `naver.maps.Event.trigger`)로 쏘고, 핸들러가 불렸는지,
 * 리스너가 몇 개 붙어 있는지(`listenerCount`), SDK 상태(`get`, `getMap`)를 본다. 리스너를 몇 번 붙였는지
 * (`listenerAdds`)는 붙였다 떼기를 반복하지 않는다는 것이 계약일 때만 본다.
 *
 * 아직 자기 mock 을 만드는 spec 이 있다(지도, 도형, 레이어 등). 그 컴포넌트를 바꾸는 변경에서 이 가짜로
 * 옮긴다.
 */

type Callback = (...args: unknown[]) => void;

export interface ListenerHandle {
  target: object;
  eventName: string;
  cb: Callback;
}

const listeners = new WeakMap<object, Map<string, Callback[]>>();
const adds = new WeakMap<object, Map<string, number>>();

function listenersOf(target: object, eventName: string): Callback[] {
  let byEvent = listeners.get(target);
  if (!byEvent) listeners.set(target, (byEvent = new Map()));
  let list = byEvent.get(eventName);
  if (!list) byEvent.set(eventName, (list = []));
  return list;
}

export const Event = {
  addListener(target: object, eventName: string, cb: Callback): ListenerHandle {
    listenersOf(target, eventName).push(cb);
    let count = adds.get(target);
    if (!count) adds.set(target, (count = new Map()));
    count.set(eventName, (count.get(eventName) ?? 0) + 1);
    return { target, eventName, cb };
  },
  removeListener(handle: ListenerHandle | ListenerHandle[]): void {
    for (const h of Array.isArray(handle) ? handle : [handle]) {
      const list = listenersOf(h.target, h.eventName);
      const i = list.indexOf(h.cb);
      if (i >= 0) list.splice(i, 1);
    }
  },
  clearInstanceListeners(target: object): void {
    listeners.delete(target);
  },
  trigger(target: object, eventName: string, ...args: unknown[]): void {
    // 리스너가 불리는 동안 떼거나 붙여도 이번 발화의 목록은 그대로다.
    for (const cb of listenersOf(target, eventName).slice()) cb(...args);
  },
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export class FakeKVO {
  /** 이 클래스가 가진 이름 있는 setter·getter 의 키. 실제 SDK 클래스와 맞는지 계약 검사가 본다. */
  static accessors: readonly string[] = [];
  /** setter·getter 밖에 가짜가 흉내 내는 메서드. 실제 클래스에 있는지 계약 검사가 본다. */
  static methods: readonly string[] = [];
  /** SDK 클래스 이름(`instances` 의 type). */
  static sdkName = 'KVO';
  private values: Record<string, unknown> = {};
  /** 생성자에 받은 옵션 그대로. */
  readonly options: Record<string, unknown> | undefined;

  constructor(options?: Record<string, unknown>) {
    this.options = options;
    for (const [k, v] of Object.entries(options ?? {})) {
      if (v !== undefined) this.values[k] = v;
    }
    const ctor = this.constructor as typeof FakeKVO;
    registry?.push({ type: ctor.sdkName, instance: this, options });
  }

  get(key: string): unknown {
    return this.values[key];
  }

  set(key: string, value: unknown): void {
    this.values[key] = value;
    Event.trigger(this, `${key}_changed`, value);
  }

  setValues(values: Record<string, unknown>): void {
    for (const [k, v] of Object.entries(values)) this.set(k, v);
  }

  setOptions(keyOrValues: string | Record<string, unknown>, value?: unknown) {
    if (typeof keyOrValues === 'string') this.set(keyOrValues, value);
    else this.setValues(keyOrValues);
  }

  getOptions(key?: string): unknown {
    return key === undefined ? { ...this.values } : this.values[key];
  }

  /** 정체 있는 KVO 객체 표시. 라이브러리는 이것으로 값 비교 대신 참조 비교를 한다(kvoEquals). */
  bindTo(): void {}

  setMap(map: unknown): void {
    this.set('map', map);
  }

  getMap(): unknown {
    return this.values.map ?? null;
  }

  destroy(): void {
    Event.clearInstanceListeners(this);
  }
}

/** 클래스 이름과 setter·getter 키로 가짜 클래스를 만든다. */
/**
 * 클래스 이름과 setter·getter 키로 가짜 클래스를 만든다. 실제 SDK 처럼 setter·getter 는 prototype 의
 * 메서드다(라이브러리가 `typeof target[setterName] === 'function'` 으로 고른다).
 */
function kvoClass(
  sdkName: string,
  accessors: readonly string[],
  methods: readonly string[] = [],
) {
  const cls = class extends FakeKVO {
    static override sdkName = sdkName;
    static override accessors = accessors;
    static override methods = methods;
  };
  const proto = cls.prototype as unknown as Record<string, unknown>;
  for (const key of accessors) {
    const setter = `set${capitalize(key)}`;
    const getter = `get${capitalize(key)}`;
    if (!(setter in proto)) {
      proto[setter] = function (this: FakeKVO, v: unknown) {
        this.set(key, v);
      };
    }
    if (!(getter in proto)) {
      proto[getter] = function (this: FakeKVO) {
        return this.get(key);
      };
    }
  }
  return cls;
}

const SHAPE = ['clickable', 'visible', 'zIndex'] as const;

export class FakeMap extends kvoClass(
  'Map',
  ['center', 'zoom', 'mapTypeId'],
  ['getElement', 'destroy'],
) {
  private readonly element: HTMLElement;
  /** 실제 SDK 처럼 (element, options). element 를 주지 않으면 새 div. */
  constructor(
    element?: HTMLElement | Record<string, unknown>,
    options?: Record<string, unknown>,
  ) {
    const el = element instanceof HTMLElement ? element : undefined;
    super(el ? options : (element as Record<string, unknown> | undefined));
    this.element = el ?? document.createElement('div');
  }
  getElement() {
    return this.element;
  }
}

export class FakeMarker extends kvoClass('Marker', [
  'position',
  'icon',
  'title',
  'cursor',
  'clickable',
  'draggable',
  'visible',
  'zIndex',
  'shape',
  'animation',
]) {}

export class FakeInfoWindow extends kvoClass(
  'InfoWindow',
  ['content', 'position', 'zIndex'],
  ['open', 'close'],
) {
  open(map: unknown, anchor?: unknown): void {
    // 실제 SDK 의 문구(3.10.5).
    if (anchor == null && this.get('position') == null) {
      throw new Error('position or anchor should be assigned.');
    }
    if (anchor !== undefined) this.set('anchor', anchor);
    this.setMap(map);
    Event.trigger(this, 'open');
  }
  close(): void {
    if (!this.getMap()) return;
    this.setMap(null);
    Event.trigger(this, 'close');
  }
}

export class FakeCircle extends kvoClass('Circle', [
  'center',
  'radius',
  ...SHAPE,
]) {}
export class FakeRectangle extends kvoClass('Rectangle', [
  'bounds',
  ...SHAPE,
]) {}
export class FakeEllipse extends kvoClass('Ellipse', ['bounds', ...SHAPE]) {}
export class FakePolygon extends kvoClass('Polygon', ['paths', ...SHAPE]) {}
export class FakePolyline extends kvoClass('Polyline', ['path', ...SHAPE]) {}
/** 실제 SDK 처럼 (url, bounds, options). url 과 bounds 는 생성 때만 정한다. */
export class FakeGroundOverlay extends kvoClass(
  'GroundOverlay',
  ['opacity'],
  ['getUrl', 'getBounds'],
) {
  constructor(url: string, bounds: unknown, options?: Record<string, unknown>) {
    super({ ...options, url, bounds });
  }
  getUrl(): unknown {
    return this.get('url');
  }
  getBounds(): unknown {
    return this.get('bounds');
  }
}
export class FakeCadastralLayer extends kvoClass('CadastralLayer', []) {}
export class FakeStreetLayer extends kvoClass('StreetLayer', []) {}
export class FakeTrafficLayer extends kvoClass(
  'TrafficLayer',
  [],
  ['startAutoRefresh', 'endAutoRefresh'],
) {
  startAutoRefresh(): void {}
  endAutoRefresh(): void {}
}

/** CustomOverlay 의 바탕. 붙으면 onAdd, 떼면 onRemove 를 부른다. */
export class FakeOverlayView extends kvoClass(
  'OverlayView',
  [],
  ['getPanes', 'getProjection'],
) {
  private panes: Record<string, HTMLDivElement> = {};

  getPanes() {
    if (!this.panes.floatPane) {
      this.panes.floatPane = document.createElement('div');
      document.body.appendChild(this.panes.floatPane);
    }
    return this.panes;
  }

  getProjection() {
    return {
      // 좌표에 따라 달라지는 변환이라 draw 를 다시 부르지 않으면 자리가 갱신되지 않는다.
      // 기준 좌표(37.5, 127)가 (100, 200)이고 경도 차이가 x, 위도 차이가 y 다.
      fromCoordToOffset: (coord: unknown) => {
        const c = coord as { lat?: () => number; lng?: () => number };
        const lat = typeof c?.lat === 'function' ? c.lat() : 37.5;
        const lng = typeof c?.lng === 'function' ? c.lng() : 127.0;
        return { x: 100 + (lng - 127.0), y: 200 + (lat - 37.5) };
      },
    };
  }

  // SDK 처럼 붙일 때 onAdd 다음 draw 를 바로 부른다(3.10.5 OverlayView.setMap).
  override setMap(map: unknown): void {
    this.set('map', map);
    if (map) {
      this.onAdd();
      this.draw();
    } else this.onRemove();
  }

  onAdd() {}
  draw() {}
  onRemove() {}
}

/** 실제 SDK 의 LatLng 처럼 x 가 경도, y 가 위도인 값 객체. 리터럴과도 같은지 본다. */
export class FakePoint {
  constructor(
    public x: number,
    public y: number,
  ) {}
  equals(other: unknown): boolean {
    const o = other as { x?: number; y?: number } | null;
    return !!o && o.x === this.x && o.y === this.y;
  }
  clone(): FakePoint {
    return new FakePoint(this.x, this.y);
  }
}

export class FakeLatLng extends FakePoint {
  constructor(
    latOrLiteral: number | { lat: number; lng: number },
    lng?: number,
  ) {
    const literal =
      typeof latOrLiteral === 'number'
        ? { lat: latOrLiteral, lng: lng! }
        : latOrLiteral;
    super(literal.lng, literal.lat);
  }
  lat(): number {
    return this.y;
  }
  lng(): number {
    return this.x;
  }
  override equals(other: unknown): boolean {
    if (other instanceof FakePoint) return super.equals(other);
    const o = other as { lat?: unknown; lng?: unknown } | null;
    return !!o && o.lat === this.y && o.lng === this.x;
  }
  override clone(): FakeLatLng {
    return new FakeLatLng(this.y, this.x);
  }
}

export const FAKE_CLASSES = {
  Map: FakeMap,
  Marker: FakeMarker,
  InfoWindow: FakeInfoWindow,
  Circle: FakeCircle,
  Rectangle: FakeRectangle,
  Ellipse: FakeEllipse,
  Polygon: FakePolygon,
  Polyline: FakePolyline,
  GroundOverlay: FakeGroundOverlay,
  CadastralLayer: FakeCadastralLayer,
  StreetLayer: FakeStreetLayer,
  TrafficLayer: FakeTrafficLayer,
  OverlayView: FakeOverlayView,
} as const;

export type FakeMaps = typeof FAKE_CLASSES & {
  LatLng: typeof FakeLatLng;
  Point: typeof FakePoint;
  Event: typeof Event;
};

export interface Created {
  type: string;
  instance: FakeKVO;
  options: Record<string, unknown> | undefined;
}

/** 지금 설치된 가짜의 생성 기록. 생성자가 여기에 더한다. */
let registry: Created[] | undefined;

/**
 * `globalThis.naver.maps` 에 가짜를 설치한다. 테스트가 끝나면 `uninstall` 한다.
 * 라이브러리는 `useNavermaps()` 로 이 객체를 받는다(테스트마다 vi.mock 으로 잇는다).
 */
export function installSdkFake() {
  const instances: Created[] = [];
  registry = instances;
  const maps: FakeMaps = {
    ...FAKE_CLASSES,
    LatLng: FakeLatLng,
    Point: FakePoint,
    Event,
  };
  (globalThis as Record<string, unknown>).naver = { maps };

  return {
    maps,
    instances,
    /** 그 클래스로 마지막에 만든 것. */
    last(type: keyof typeof FAKE_CLASSES): Created | undefined {
      return instances.findLast((i) => i.type === type);
    },
    /** SDK 로 이벤트를 쏜다(`naver.maps.Event.trigger`). */
    fire(target: object, eventName: string, ...args: unknown[]): void {
      Event.trigger(target, eventName, ...args);
    },
    /** 지금 붙어 있는 리스너 수. */
    listenerCount(target: object, eventName: string): number {
      return listeners.get(target)?.get(eventName)?.length ?? 0;
    },
    /** 지금까지 붙인 횟수(뗀 것 포함). 붙였다 떼기를 반복하지 않는다는 계약을 볼 때만 쓴다. */
    listenerAdds(target: object, eventName: string): number {
      return adds.get(target)?.get(eventName) ?? 0;
    },
    uninstall(): void {
      delete (globalThis as Record<string, unknown>).naver;
      instances.length = 0;
      registry = undefined;
    },
  };
}

export type SdkFake = ReturnType<typeof installSdkFake>;
