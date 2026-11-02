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
