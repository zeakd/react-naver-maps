/**
 * 화면 자리를 잴 수 있는 오버레이 하나. overlayDrift 가 지도가 그 좌표를 그리는 자리와 견준다.
 * 둘 다 문서(page) 기준 px 이다.
 */
export type OverlayAnchor = {
  /** 오버레이가 놓여야 하는 좌표. 지도에서 떨어져 있으면 null */
  coord(): naver.maps.Coord | null;
  /** 오버레이 element 의 기준점. element 를 못 찾으면 null */
  screen(): [number, number] | null;
  /**
   * true 면 screen() 이 근사다. 첫 측정의 차이를 고정 편차로 보고 뺀다(움직임만 본다).
   * 기준점 규칙을 확인하지 못한 오버레이에 쓴다.
   */
  approximate?: boolean;
};

/** 지도 본체가 쥐는 관찰 상태. 여러 픽스처가 함께 쓰는 것만 둔다(기능 하나만의 상태는 그 픽스처의 probe). */
export type Observed = {
  calls: string[];
  /** 0.4 에서 생긴 이벤트 prop 이 불린 기록. 0.3.0 과의 비교에서 뺀다(compare-expected 의 NEW_API_FIELDS). */
  propCalls: string[];
  events: string[];
  zoomReports: number[];
  /** 아직 프레임에 싣지 않은 pageerror·console.error 의 글 */
  errors: string[];
  kvo: { zoom: number; lat: number };
  /** ref 로 받은 오버레이. 떨어져도 마지막 인스턴스를 본다. 여러 픽스처가 이름으로 넣는다. */
  overlays: Record<string, { getMap(): unknown }>;
  recordOverlay: (name: string, o: { getMap(): unknown } | null) => void;
  /** overlayDrift 로 잴 오버레이. 이름이 프레임의 키다. null 이면 건너뛴다(마지막 것을 둔다). */
  anchors: Record<string, OverlayAnchor>;
  recordAnchor: (name: string, anchor: OverlayAnchor | null) => void;
  recordKvo: (zoom: number, lat: number) => void;
};

export function createObserved(): Observed {
  const observed: Observed = {
    calls: [],
    propCalls: [],
    events: [],
    zoomReports: [],
    errors: [],
    kvo: { zoom: 0, lat: 0 },
    overlays: {},
    anchors: {},
    recordOverlay(name, o) {
      if (o) observed.overlays[name] = o;
    },
    recordAnchor(name, anchor) {
      if (anchor) observed.anchors[name] = anchor;
    },
    recordKvo(zoom, lat) {
      observed.kvo = { zoom, lat };
    },
  };
  return observed;
}

const OBSERVED = Symbol('observed');

/** target 의 메서드 호출을 calls 에 적는다. 이미 감싼 메서드는 다시 감싸지 않는다. */
export function observe(target: object, methods: string[], calls: string[]) {
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
