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
