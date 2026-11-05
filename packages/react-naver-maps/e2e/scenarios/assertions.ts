import type { Assertion, LL, TraceFrame } from './types.js';

const EPSILON_DEG = 1e-6;

function near(a: LL, b: LL) {
  return (
    Math.abs(a[0] - b[0]) < EPSILON_DEG && Math.abs(a[1] - b[1]) < EPSILON_DEG
  );
}

function distance(a: LL, b: LL) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function callsOf(trace: TraceFrame[]) {
  return trace.flatMap((f) => f.calls);
}

/** 마지막 프레임의 center 가 target 이다. */
export function settlesAt(target: LL): Assertion {
  return (trace) => {
    const last = trace.at(-1)!;
    return near(last.center, target)
      ? null
      : `마지막 center ${last.center} 가 ${target} 이 아니다`;
  };
}

/** 마지막 프레임의 zoom 이 target 이다. */
export function settlesAtZoom(target: number): Assertion {
  return (trace) => {
    const last = trace.at(-1)!;
    return last.zoom === target
      ? null
      : `마지막 zoom ${last.zoom} 이 ${target} 이 아니다`;
  };
}

/** from 프레임부터 target 까지의 거리가 줄어들기만 한다. */
export function noBacktrack(target: LL, from = 0): Assertion {
  return (trace) => {
    for (let i = from + 1; i < trace.length; i++) {
      const before = distance(trace[i - 1].center, target);
      const after = distance(trace[i].center, target);
      if (after > before + EPSILON_DEG) {
        return `프레임 ${i} 에서 목표와 멀어졌다 (${before} -> ${after})`;
      }
    }
    return null;
  };
}

/** 지도 메서드 호출 횟수가 정확히 expected 와 같다. */
export function calls(expected: Record<string, number>): Assertion {
  return (trace) => {
    const all = callsOf(trace);
    for (const [method, count] of Object.entries(expected)) {
      const actual = all.filter((c) => c === method).length;
      if (actual !== count) {
        return `${method} 호출 ${actual}회, 기대 ${count}회 (전체: ${all.join(', ') || '없음'})`;
      }
    }
    return null;
  };
}

/** onZoomChanged 로 받은 값이 같은 프레임의 getZoom() 과 같다. */
export function zoomReportsMatchMap(): Assertion {
  return (trace) => {
    for (const [i, frame] of trace.entries()) {
      const wrong = frame.zoomReports.find((z) => z !== frame.zoom);
      if (wrong !== undefined) {
        return `프레임 ${i}: onZoomChanged(${wrong}), getZoom() ${frame.zoom}`;
      }
    }
    return trace.some((f) => f.zoomReports.length > 0)
      ? null
      : 'onZoomChanged 가 호출되지 않았다';
  };
}

/** 모든 프레임에서 컨트롤 수가 count 다. */
export function controlCount(count: number): Assertion {
  return (trace) => {
    const wrong = trace.find((f) => f.controls !== count);
    return wrong ? `컨트롤 ${wrong.controls}개, 기대 ${count}개` : null;
  };
}

/** 이벤트가 한 번이라도 발생했다. */
export function fired(event: string, count?: number): Assertion {
  return (trace) => {
    const actual = trace.flatMap((f) => f.events).filter((e) => e === event);
    if (count === undefined) {
      return actual.length > 0 ? null : `${event} 가 발생하지 않았다`;
    }
    return actual.length === count
      ? null
      : `${event} ${actual.length}회, 기대 ${count}회`;
  };
}

/** 마지막 프레임에 지도 DOM 이 문서에 붙어 있다. */
export function mapAttached(): Assertion {
  return (trace) =>
    trace.at(-1)!.attached ? null : '지도 DOM 이 문서에서 떨어졌다';
}

/** 마지막 프레임에 useKVO 값이 지도와 같다. */
export function kvoFollowsMap(): Assertion {
  return (trace) => {
    const last = trace.at(-1)!;
    if (last.kvoZoom !== last.zoom) {
      return `useKVO zoom ${last.kvoZoom}, 지도 ${last.zoom}`;
    }
    return Math.abs(last.kvoLat - last.center[0]) < EPSILON_DEG
      ? null
      : `useKVO 위도 ${last.kvoLat}, 지도 ${last.center[0]}`;
  };
}

/** 마지막 프레임까지 Marker 클릭을 count 번 받았다. */
export function markerClicked(count: number): Assertion {
  return (trace) => {
    const actual = trace.at(-1)!.markerClicks;
    return actual === count ? null : `Marker 클릭 ${actual}회, 기대 ${count}회`;
  };
}

/** 마지막 프레임에 지도 너비가 width 다. */
export function mapWidth(width: number): Assertion {
  return (trace) => {
    const actual = trace.at(-1)!.mapWidth;
    return actual === width ? null : `지도 너비 ${actual}, 기대 ${width}`;
  };
}

/** 마지막 프레임까지 Circle 클릭을 count 번 받았다. */
export function circleClicked(count: number): Assertion {
  return (trace) => {
    const actual = trace.at(-1)!.circleClicks;
    return actual === count ? null : `Circle 클릭 ${actual}회, 기대 ${count}회`;
  };
}

/**
 * from 프레임부터 to 프레임까지 경도가 한 방향으로만 움직인다. 드래그가 되돌려지거나
 * 떨리면 방향이 바뀐다.
 */
export function oneWay(from = 0, to?: number): Assertion {
  return (trace) => {
    const end = Math.min(to ?? trace.length, trace.length);
    let sign = 0;
    for (let i = from + 1; i < end; i++) {
      const d = trace[i].center[1] - trace[i - 1].center[1];
      if (Math.abs(d) < EPSILON_DEG) continue;
      const s = Math.sign(d);
      if (sign !== 0 && s !== sign) {
        return `프레임 ${i} 에서 경도 방향이 바뀌었다 (${trace[i - 1].center[1]} -> ${trace[i].center[1]})`;
      }
      sign = s;
    }
    return null;
  };
}

/** from 프레임부터 to 프레임 앞까지 zoom 이 한 방향으로만 바뀐다. 같은 값을 유지하는 것은 허용한다. */
export function zoomOneWay(from = 0, to?: number): Assertion {
  return (trace) => {
    const end = Math.min(to ?? trace.length, trace.length);
    let sign = 0;
    for (let i = from + 1; i < end; i++) {
      const d = trace[i].zoom - trace[i - 1].zoom;
      if (Math.abs(d) < EPSILON_DEG) continue;
      const s = Math.sign(d);
      if (sign !== 0 && s !== sign) {
        return `프레임 ${i} 에서 zoom 방향이 바뀌었다 (${trace[i - 1].zoom} -> ${trace[i].zoom})`;
      }
      sign = s;
    }
    return null;
  };
}

/** from 프레임부터 to 프레임 앞까지 Marker 경도가 한 방향으로만 바뀐다. Marker 가 없는 프레임은 건너뛴다. */
export function markerOneWay(from = 0, to?: number): Assertion {
  return (trace) => {
    const end = Math.min(to ?? trace.length, trace.length);
    let sign = 0;
    for (let i = from + 1; i < end; i++) {
      const a = trace[i - 1].markerPosition;
      const b = trace[i].markerPosition;
      if (!a || !b) continue;
      const d = b[1] - a[1];
      if (Math.abs(d) < EPSILON_DEG) continue;
      const s = Math.sign(d);
      if (sign !== 0 && s !== sign) {
        return `프레임 ${i} 에서 Marker 경도 방향이 바뀌었다 (${a[1]} -> ${b[1]})`;
      }
      sign = s;
    }
    return null;
  };
}

/** from 프레임 뒤로 center 가 움직이지 않는다. */
export function staysAfter(from: number): Assertion {
  return (trace) => {
    const base = trace[from]?.center;
    if (!base) return `프레임 ${from} 이 없다`;
    for (let i = from + 1; i < trace.length; i++) {
      if (!near(trace[i].center, base)) {
        return `프레임 ${i} 에서 움직였다 (${base} -> ${trace[i].center})`;
      }
    }
    return null;
  };
}

/** 마지막 프레임의 Marker 위치가 target 이다. */
export function markerAt(target: LL): Assertion {
  return (trace) => {
    const p = trace.at(-1)!.markerPosition;
    if (!p) return 'Marker 가 없다';
    return near(p, target) ? null : `Marker 위치 ${p}, 기대 ${target}`;
  };
}

/** 마지막 프레임의 Marker 위치가 target 이 아니다(사용자가 옮긴 자리에 있다). */
export function markerMovedFrom(target: LL): Assertion {
  return (trace) => {
    const p = trace.at(-1)!.markerPosition;
    if (!p) return 'Marker 가 없다';
    return near(p, target) ? `Marker 가 ${target} 으로 돌아갔다` : null;
  };
}

/** from 프레임부터 to 프레임 앞까지 지도 메서드 호출 횟수가 expected 와 같다. */
export function callsIn(
  from: number,
  to: number,
  expected: Record<string, number>,
): Assertion {
  return (trace) => calls(expected)(trace.slice(from, to));
}

/** event 가 마지막으로 난 프레임 뒤에(같은 프레임 포함) idle 이 정확히 한 번 온다. */
export function idleAfter(event: string): Assertion {
  return (trace) => {
    let at = -1;
    trace.forEach((f, i) => {
      if (f.events.includes(event)) at = i;
    });
    if (at === -1) return `${event} 가 없다`;
    const idles = trace
      .slice(at)
      .flatMap((f) => f.events)
      .filter((e) => e === 'idle').length;
    return idles === 1
      ? null
      : `${event}(프레임 ${at}) 뒤 idle ${idles}회, 기대 1회`;
  };
}

/** 처음 프레임과 to 프레임 사이에 경도가 minDeg 보다 많이 움직였다. 드래그가 먹혔는지 본다. */
export function movedBy(minDeg: number, to?: number): Assertion {
  return (trace) => {
    const end = trace[Math.min(to ?? trace.length - 1, trace.length - 1)]!;
    const d = Math.abs(end.center[1] - trace[0]!.center[1]);
    return d > minDeg ? null : `경도가 ${d} 만 움직였다 (기대 > ${minDeg})`;
  };
}

/** 모든 프레임에서 지도 인스턴스가 처음 프레임과 같다. */
export function sameMap(): Assertion {
  return (trace) => {
    const first = trace[0]!.mapId;
    const i = trace.findIndex((f) => f.mapId !== first);
    return i === -1
      ? null
      : `프레임 ${i} 에서 지도 인스턴스가 바뀌었다 (${first} -> ${trace[i]!.mapId})`;
  };
}

/** at 프레임(음수면 끝에서부터)에 Marker 가 지도에 붙어 있는지가 expected 다. */
export function markerOnMap(expected: boolean, at = -1): Assertion {
  return (trace) => {
    const f = trace.at(at)!;
    return f.markerOnMap === expected
      ? null
      : `프레임 ${at < 0 ? trace.length + at : at} 에 Marker 가 지도에 ${f.markerOnMap ? '붙어' : '안 붙어'} 있다 (기대 ${expected})`;
  };
}

/** at 프레임(음수면 끝에서부터)에 지도에 붙은 오버레이가 expected 다. */
export function overlaysOnMap(expected: string[], at = -1): Assertion {
  return (trace) => {
    const f = trace.at(at)!;
    const want = expected.toSorted();
    return JSON.stringify(f.overlaysOnMap) === JSON.stringify(want)
      ? null
      : `프레임 ${at < 0 ? trace.length + at : at} 에 붙은 오버레이 ${JSON.stringify(f.overlaysOnMap)}, 기대 ${JSON.stringify(want)}`;
  };
}

/** 마지막 프레임까지 만들어진 GroundOverlay 수가 count 다. */
export function groundOverlaysCreated(count: number): Assertion {
  return (trace) => {
    const actual = trace.at(-1)!.groundOverlays;
    return actual === count
      ? null
      : `GroundOverlay ${actual}개 생성, 기대 ${count}개`;
  };
}

/** at 프레임(음수면 끝에서부터)에 CustomControl 이 position 자리에 있다. null 이면 어디에도 없다. */
export function customControlAt(position: number | null, at = -1): Assertion {
  return (trace) => {
    const f = trace.at(at)!;
    return f.customControlAt === position
      ? null
      : `프레임 ${at < 0 ? trace.length + at : at} 에 CustomControl 자리 ${f.customControlAt}, 기대 ${position}`;
  };
}

/** at 프레임(음수면 끝에서부터)에 CustomControl 안에 text 가 그려져 있다. */
export function customControlText(text: string, at = -1): Assertion {
  return (trace) => {
    const actual = trace.at(at)!.customControlText;
    return actual === text
      ? null
      : `CustomControl 글자 ${JSON.stringify(actual)}, 기대 ${JSON.stringify(text)}`;
  };
}

/** at 프레임(음수면 끝에서부터)의 데이터 레이어 상태. */
export function dataLayer(
  expected: { features?: number; fillColor?: string | null; clicks?: number },
  at = -1,
): Assertion {
  return (trace) => {
    const f = trace.at(at)!;
    const where = `프레임 ${at < 0 ? trace.length + at : at}`;
    if (expected.features !== undefined && f.dataFeatures !== expected.features)
      return `${where} feature ${f.dataFeatures}개, 기대 ${expected.features}개`;
    if (
      expected.fillColor !== undefined &&
      f.dataFillColor !== expected.fillColor
    )
      return `${where} fillColor ${f.dataFillColor}, 기대 ${expected.fillColor}`;
    if (expected.clicks !== undefined && f.geoJsonClicks !== expected.clicks)
      return `${where} GeoJson 클릭 ${f.geoJsonClicks}회, 기대 ${expected.clicks}회`;
    return null;
  };
}

/** at 프레임(음수면 끝에서부터)에 HeatMap opacity 가 expected 다. */
export function heatMapOpacity(expected: number | null, at = -1): Assertion {
  return (trace) => {
    const actual = trace.at(at)!.heatMapOpacity;
    return actual === expected
      ? null
      : `프레임 ${at < 0 ? trace.length + at : at} 에 HeatMap opacity ${actual}, 기대 ${expected}`;
  };
}

/** probe 로 잰 값 name 이 min 이상인 프레임이 있다. */
export function probedAtLeast(name: string, min: number): Assertion {
  return (trace) => {
    const values = trace
      .map((f) => f.probes?.[name])
      .filter((v) => v !== undefined);
    if (values.length === 0) return `${name} 를 재지 않았다`;
    return values.some((v) => v! >= min)
      ? null
      : `${name} ${values.join(', ')}, 기대 ${min} 이상`;
  };
}

/** 마지막 프레임의 DrawingManager 상태. */
export function drawn(expected: {
  drawings: number;
  added: number;
}): Assertion {
  return (trace) => {
    const f = trace.at(-1)!;
    return f.drawings === expected.drawings && f.drawingAdded === expected.added
      ? null
      : `그린 도형 ${f.drawings}개·onDrawingAdded ${f.drawingAdded}회, 기대 ${expected.drawings}개·${expected.added}회`;
  };
}

/** probe 로 잰 값 name 의 nth 번째(0부터)가 ok 를 만족한다. */
export function probedAt(
  name: string,
  nth: number,
  ok: (value: number) => boolean,
): Assertion {
  return (trace) => {
    const values = trace
      .map((f) => f.probes?.[name])
      .filter((v): v is number => v !== undefined);
    const value = values[nth];
    if (value === undefined)
      return `${name} 의 ${nth} 번째 값이 없다 (${values.length}개)`;
    return ok(value) ? null : `${name} 의 ${nth} 번째 값이 ${value} 다`;
  };
}

/** 마지막 프레임의 field 가 value 와 같다. */
export function lastFrame<K extends keyof TraceFrame>(
  field: K,
  value: TraceFrame[K],
): Assertion {
  return (trace) => {
    const actual = trace.at(-1)?.[field];
    return Object.is(actual, value)
      ? null
      : `마지막 프레임 ${String(field)}: ${JSON.stringify(actual)}, 기대 ${JSON.stringify(value)}`;
  };
}

/** at 번째 프레임의 숫자 field 가 ok 를 만족한다. */
export function frameAt<K extends keyof TraceFrame>(
  at: number,
  field: K,
  ok: (v: TraceFrame[K]) => boolean,
): Assertion {
  return (trace) => {
    const v = trace[at]?.[field];
    return v !== undefined && ok(v as TraceFrame[K])
      ? null
      : `프레임 ${at} ${String(field)}: ${JSON.stringify(v)}`;
  };
}

// 화면 1px 에 해당하는 경도 차이를 구할 때 쓰는 Web Mercator 근사. 네이버 지도의 zoom 0 은 256px 한 장이라는
// 가정(추정, 실측 전)이다. 허용치가 몇 px 짜리라 이 정도 오차는 판정에 영향이 없다.
function pxPerDegreeLng(zoom: number) {
  return (256 * 2 ** zoom) / 360;
}

/**
 * from 프레임부터 모든 프레임에서 지도가 앱이 내려준 prop 을 따른다: center 가 propCenter 와 화면 2px 안,
 * zoom 이 propZoom 과 0.01 안.
 * 근거: 매 프레임 prop 이 바뀌는 시나리오는 한 프레임에 5px 안팎씩 움직이게 짠다. 한 프레임 뒤처지면
 * 5px 이상 벌어지므로 2px 은 "같은 프레임에 따라왔다"를 가르면서 투영·반올림 오차(1px 미만)는 넘긴다.
 * zoom 0.01 은 getZoom() 의 부동소수 오차보다 크고 시나리오의 프레임당 변화(0.02)보다 작다.
 */
export function followsProps(from = 0, maxPx = 2, maxZoom = 0.01): Assertion {
  return (trace) => {
    for (let i = from; i < trace.length; i++) {
      const f = trace[i]!;
      if (!f.propCenter || f.propZoom === null) {
        return `프레임 ${i} 에 내려준 prop 이 없다`;
      }
      const k = pxPerDegreeLng(f.zoom);
      const dx = (f.center[1] - f.propCenter[1]) * k;
      const dy =
        ((f.center[0] - f.propCenter[0]) * k) /
        Math.cos((f.propCenter[0] * Math.PI) / 180);
      const px = Math.hypot(dx, dy);
      if (px > maxPx) {
        return `프레임 ${i} 에서 center 가 prop 과 ${px.toFixed(1)}px 떨어졌다 (허용 ${maxPx}px)`;
      }
      // 래스터 지도는 실수 zoom 을 반올림해 쓴다(GL 은 renderMode 2). SDK 가 쓸 수 있는 zoom 과 비교한다.
      const want = f.renderMode === 2 ? f.propZoom : Math.round(f.propZoom);
      if (Math.abs(f.zoom - want) > maxZoom) {
        return `프레임 ${i} 에서 zoom ${f.zoom} 이 prop ${f.propZoom}(지도가 쓸 값 ${want}) 과 다르다 (허용 ${maxZoom})`;
      }
    }
    return null;
  };
}

/** 모든 프레임에서 지도 element 가 보인다. */
export function mapVisible(): Assertion {
  return (trace) => {
    const i = trace.findIndex((f) => !f.mapVisible);
    return i === -1 ? null : `프레임 ${i} 에서 지도가 보이지 않는다`;
  };
}

/**
 * 어떤 프레임에도 pageerror·console.error 가 없다. allow 에 맞는 글은 건너뛴다
 * (에러 경계가 일부러 잡은 에러 등).
 */
export function noErrors(allow?: RegExp): Assertion {
  return (trace) => {
    for (const [i, f] of trace.entries()) {
      const bad = f.errors.find((e) => !allow?.test(e));
      if (bad !== undefined)
        return `프레임 ${i} 에서 에러: ${bad.slice(0, 200)}`;
    }
    return null;
  };
}

/** infoWindowOnMarker 의 InfoWindow 가 InfoWindow 가 생긴 뒤 모든 프레임에서 열려 있다. */
export function infoWindowAlwaysOpen(): Assertion {
  return (trace) => {
    const i = trace.findIndex((f) => f.infoWindowOpen === false);
    return i === -1 ? null : `프레임 ${i} 에서 InfoWindow 가 닫혀 있다`;
  };
}

/** 마지막 프레임에서 infoWindowOnMarker 의 InfoWindow 위치가 anchor Marker 위치다. */
export function infoWindowAtAnchor(): Assertion {
  return (trace) => {
    const f = trace.at(-1)!;
    if (!f.infoWindowPosition || !f.infoWindowAnchorAt) {
      return 'InfoWindow 또는 anchor Marker 가 없다';
    }
    return near(f.infoWindowPosition, f.infoWindowAnchorAt)
      ? null
      : `InfoWindow 위치 ${f.infoWindowPosition}, anchor Marker ${f.infoWindowAnchorAt}`;
  };
}

/**
 * from 프레임부터 to 프레임 앞까지 naver.maps.Event.addListener 호출이 max 번 이하로 늘어난다.
 * max 를 Infinity 로 두면 판정하지 않고 증가량만 실패 메시지 없이 지나간다(값은 trace.json 의
 * addListenerCalls 로 본다).
 */
export function addListenerCallsWithin(
  from: number,
  to: number,
  max: number,
): Assertion {
  return (trace) => {
    const before = trace[Math.max(from - 1, 0)]!.addListenerCalls;
    const after = trace[Math.min(to, trace.length) - 1]!.addListenerCalls;
    return after - before <= max
      ? null
      : `프레임 ${from}~${to} 에 addListener ${after - before}회 (상한 ${max})`;
  };
}

/**
 * editablePolygon 의 첫 꼭짓점이 경도 줄어드는 방향(왼쪽)으로만 움직이고, 끝에서 처음보다 minDeg 이상
 * 옮겨져 있다.
 */
export function polygonFirstMovesLeft(minDeg: number): Assertion {
  return (trace) => {
    let prev: number | undefined;
    for (const [i, f] of trace.entries()) {
      if (!f.polygonFirst) return `프레임 ${i} 에 Polygon 이 없다`;
      const lng = f.polygonFirst[1];
      if (prev !== undefined && lng > prev + EPSILON_DEG) {
        return `프레임 ${i} 에서 꼭짓점이 끄는 반대 방향으로 갔다 (${prev} -> ${lng})`;
      }
      prev = lng;
    }
    const moved = trace[0]!.polygonFirst![1] - trace.at(-1)!.polygonFirst![1];
    return moved >= minDeg
      ? null
      : `꼭짓점이 ${moved} 만 옮겨졌다 (기대 >= ${minDeg})`;
  };
}

/**
 * from 프레임부터 to 프레임 앞까지 모든 프레임에서 잴 오버레이마다 overlayDrift 가 maxPx 이하다.
 * 잴 오버레이는 only, 없으면 구간 첫 프레임에 잰 것이다. 구간 안에서 하나라도 null(지도에 없음)이면 실패다.
 */
export function overlaysStayPut(
  maxPx: number,
  from = 0,
  to?: number,
  only?: string[],
): Assertion {
  return (trace) => {
    const start = from < 0 ? trace.length + from : from;
    const end = Math.min(to ?? trace.length, trace.length);
    // 잴 오버레이: only 를 주면 그것, 아니면 구간 첫 프레임에 잰 것. 구간 내내 모두 재져야 한다. 하나라도
    // 사라지면(지도에서 떨어짐) 나머지로 통과하던 것을 막는다(2026-11-05 리뷰).
    const first = trace[start]?.overlayDrift ?? {};
    const names =
      only ?? Object.keys(first).filter((n) => first[n] !== null);
    if (names.length === 0 || start >= end) {
      return '오버레이 위치를 한 번도 재지 못했다';
    }
    for (let i = start; i < end; i++) {
      const drift = trace[i]!.overlayDrift;
      for (const name of names) {
        const px = drift[name];
        if (px === null || px === undefined) {
          return `프레임 ${i} 에서 ${name} 의 위치를 재지 못했다(지도에 없다)`;
        }
        if (px > maxPx) {
          return `프레임 ${i} 에서 ${name} 가 지도의 자기 좌표에서 ${px.toFixed(1)}px 벗어났다 (허용 ${maxPx}px)`;
        }
      }
    }
    return null;
  };
}

/**
 * 오버레이가 Marker(SDK 가 그린다)와 함께 움직인다: overlayOffsetFromMarker 가 첫 프레임과 maxPx 안이다.
 * frames 'last' 는 마지막 프레임만 본다. 래스터 줌 애니메이션은 pane 에 확대 변환을 걸어 기준점 사이
 * 거리도 함께 늘어나므로, 줌 시나리오는 멈춘 뒤만 본다.
 */
export function overlaysMoveWithMarker(
  maxPx: number,
  frames: 'all' | 'last' = 'all',
  only?: string[],
): Assertion {
  return (trace) => {
    const base = trace[0]!.overlayOffsetFromMarker;
    const names = Object.keys(base).filter(
      (n) => base[n] && (!only || only.includes(n)),
    );
    if (names.length === 0) return 'Marker 와의 간격을 재지 못했다';
    const from = frames === 'last' ? trace.length - 1 : 0;
    for (let i = from; i < trace.length; i++) {
      for (const name of names) {
        const a = base[name]!;
        const b = trace[i]!.overlayOffsetFromMarker[name];
        if (!b) return `프레임 ${i} 에 ${name} 가 없다`;
        const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (d > maxPx) {
          return `프레임 ${i} 에서 ${name} 가 Marker 에 비해 ${d.toFixed(1)}px 어긋났다 (허용 ${maxPx}px)`;
        }
      }
    }
    return null;
  };
}

/** 모든 프레임에서 두 번째 지도의 center 가 처음 프레임과 같다. */
export function secondMapStaysPut(): Assertion {
  return (trace) => {
    const base = trace[0]!.secondCenter;
    if (!base) return '두 번째 지도가 없다';
    const i = trace.findIndex(
      (f) => !f.secondCenter || !near(f.secondCenter, base),
    );
    return i === -1
      ? null
      : `프레임 ${i} 에서 두 번째 지도 center 가 ${trace[i]!.secondCenter} 로 바뀌었다 (처음 ${base})`;
  };
}

/** 마지막 프레임에서 두 번째 지도의 center 가 target 이다. */
export function secondSettlesAt(target: LL): Assertion {
  return (trace) => {
    const c = trace.at(-1)!.secondCenter;
    if (!c) return '두 번째 지도가 없다';
    return near(c, target)
      ? null
      : `마지막 두 번째 지도 center ${c} 가 ${target} 이 아니다`;
  };
}

/** from 프레임부터 모든 프레임에서 첫 지도와 두 번째 지도의 InfoWindow 가 각자의 지도에 열려 있다. */
export function infoWindowsOpenOnBothMaps(from = 0): Assertion {
  return (trace) => {
    for (let i = from; i < trace.length; i++) {
      const f = trace[i]!;
      if (!f.overlaysOnMap.includes('infoWindow')) {
        return `프레임 ${i} 에서 첫 지도의 InfoWindow 가 닫혀 있다`;
      }
      if (f.secondInfoWindowOpen !== true) {
        return `프레임 ${i} 에서 두 번째 지도의 InfoWindow 가 닫혀 있다 (${f.secondInfoWindowOpen})`;
      }
    }
    return null;
  };
}
