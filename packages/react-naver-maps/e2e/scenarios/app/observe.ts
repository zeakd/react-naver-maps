/** 지도 본체가 쥐는 관찰 상태. 여러 픽스처가 함께 쓰는 것만 둔다(기능 하나만의 상태는 그 픽스처의 probe). */
export type Observed = {
  calls: string[];
  /** 0.4 에서 생긴 이벤트 prop 이 불린 기록. 0.3.0 과의 비교에서 뺀다(compare-expected 의 NEW_API_FIELDS). */
  propCalls: string[];
  events: string[];
  zoomReports: number[];
  kvo: { zoom: number; lat: number };
  /** ref 로 받은 오버레이. 떨어져도 마지막 인스턴스를 본다. 여러 픽스처가 이름으로 넣는다. */
  overlays: Record<string, { getMap(): unknown }>;
  recordOverlay: (name: string, o: { getMap(): unknown } | null) => void;
  recordKvo: (zoom: number, lat: number) => void;
};

export function createObserved(): Observed {
  const observed: Observed = {
    calls: [],
    propCalls: [],
    events: [],
    zoomReports: [],
    kvo: { zoom: 0, lat: 0 },
    overlays: {},
    recordOverlay(name, o) {
      if (o) observed.overlays[name] = o;
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
