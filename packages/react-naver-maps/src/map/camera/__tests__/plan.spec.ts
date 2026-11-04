import { describe, expect, test } from 'vitest';
import { EchoLog } from '../echo.js';
import {
  planCamera,
  type CameraInput,
  type CameraProps,
  type CoordValue,
} from '../plan.js';

// 화면 1px 판정의 가짜: 위도·경도 차이가 2^-zoom 도 안이면 같은 자리로 본다(zoom 이 1 크면 기준이 반).
const near = (a: CoordValue, b: CoordValue, zoom: number) => {
  const p = a as { lat: number; lng: number };
  const q = b as { lat: number; lng: number };
  return Math.hypot(p.lat - q.lat, p.lng - q.lng) < 2 ** -zoom;
};

const at = (lat: number, lng = 127) => ({ lat, lng });

/** 지도가 (37.5, 127), zoom 10 에 있고 바뀐 것이 없는 상태에서 일부만 고친다. */
function input(
  over: Partial<CameraInput> & {
    mapZoom?: number;
    mapCenter?: CoordValue;
    gl?: boolean;
  } = {},
): CameraInput {
  const { mapZoom = 10, mapCenter = at(37.5), gl = false, ...rest } = over;
  const prev: CameraProps = { center: at(37.5), zoom: 10 };
  return {
    prev,
    next: prev,
    map: {
      center: () => mapCenter,
      zoom: () => mapZoom,
      bounds: () => ({ south: 0, west: 0, north: 1, east: 1 }),
      centerPoint: () => ({ x: 0, y: 0 }),
      gl,
      sameOnScreen: near,
    },
    isCenterEcho: () => false,
    isZoomEcho: () => false,
    pendingMove: false,
    gesture: 'none',
    following: false,
    ...rest,
  };
}

describe('planCamera', () => {
  test('prop 이 지난 렌더와 값으로 같으면 넣지 않는다(새로 만든 같은 객체도)', () => {
    const plan = planCamera(input({ next: { center: at(37.5), zoom: 10 } }));
    expect(plan).toEqual({ stop: false, kind: 'none' });
  });

  test('center 만 바뀌면 panTo', () => {
    const plan = planCamera(input({ next: { center: at(38), zoom: 10 } }));
    expect(plan).toEqual({
      stop: false,
      kind: 'move',
      command: { kind: 'panTo', center: at(38) },
    });
  });

  test('zoom 만 바뀌면 setZoom', () => {
    const plan = planCamera(input({ next: { center: at(37.5), zoom: 12 } }));
    expect(plan).toMatchObject({
      kind: 'move',
      command: { kind: 'setZoom', zoom: 12 },
    });
  });

  test('center 와 zoom 이 함께 바뀌면 morph 하나', () => {
    const plan = planCamera(input({ next: { center: at(38), zoom: 12 } }));
    expect(plan).toMatchObject({
      kind: 'move',
      command: { kind: 'morph', center: at(38), zoom: 12, animate: true },
    });
  });

  test('우선순위: bounds 가 center·zoom 보다 먼저다', () => {
    const bounds = { south: 1, west: 1, north: 2, east: 2 };
    const plan = planCamera(
      input({ next: { center: at(38), zoom: 12, bounds } }),
    );
    expect(plan).toMatchObject({ command: { kind: 'fitBounds', bounds } });
  });

  test('우선순위: centerPoint 는 morph 다음, panTo 보다 먼저다', () => {
    const centerPoint = { x: 5, y: 5 };
    expect(
      planCamera(input({ next: { center: at(38), zoom: 10, centerPoint } })),
    ).toMatchObject({ command: { kind: 'setCenterPoint' } });
    expect(
      planCamera(input({ next: { center: at(38), zoom: 12, centerPoint } })),
    ).toMatchObject({ command: { kind: 'morph' } });
  });

  test('바뀌었어도 지도가 이미 화면 1px 안이면 넣지 않는다', () => {
    const plan = planCamera(
      input({ next: { center: at(37.5 + 2 ** -12), zoom: 10 } }),
    );
    expect(plan.kind).toBe('none');
  });

  test('zoom 도 바뀌면 1px 은 더 큰 zoom 에서 잰다', () => {
    // zoom 10 에서는 1px 안이지만 zoom 18 에서는 아니다.
    const next = { center: at(37.5 + 2 ** -12), zoom: 18 };
    expect(planCamera(input({ next }))).toMatchObject({
      command: { kind: 'morph', zoom: 18 },
    });
  });

  test('래스터는 실수 zoom 을 반올림해 같으면 바뀌지 않은 것으로 본다. GL 은 실수 그대로다', () => {
    const next = { center: at(37.5), zoom: 10.4 };
    expect(planCamera(input({ next })).kind).toBe('none');
    expect(planCamera(input({ next, gl: true }))).toMatchObject({
      command: { kind: 'setZoom', zoom: 10.4 },
    });
  });

  test('되울림인 center·zoom 은 따르지 않는다', () => {
    expect(
      planCamera(
        input({ next: { center: at(38), zoom: 10 }, isCenterEcho: () => true }),
      ).kind,
    ).toBe('none');
    expect(
      planCamera(
        input({
          next: { center: at(37.5), zoom: 10.5 },
          gl: true,
          isZoomEcho: () => true,
        }),
      ).kind,
    ).toBe('none');
  });

  test('반영 전 이동이 있는데 prop 이 지금 자리로 돌아오면 멈춘다', () => {
    const plan = planCamera(
      input({
        prev: { center: at(38), zoom: 10 },
        next: { center: at(37.5), zoom: 10 },
        pendingMove: true,
      }),
    );
    expect(plan).toEqual({ stop: true, kind: 'none' });
  });

  test('제스처 중에는 보류하고, 바뀐 것이 있을 때만 held 로 알린다', () => {
    expect(
      planCamera(
        input({ next: { center: at(38), zoom: 10 }, gesture: 'active' }),
      ),
    ).toEqual({ stop: false, kind: 'hold', held: true });
    expect(planCamera(input({ gesture: 'settling' }))).toEqual({
      stop: false,
      kind: 'hold',
      held: false,
    });
  });

  test('제스처 중이어도 멈춤은 먼저 한다', () => {
    const plan = planCamera(
      input({
        prev: { center: at(38), zoom: 10 },
        next: { center: at(37.5), zoom: 10 },
        pendingMove: true,
        gesture: 'active',
      }),
    );
    expect(plan).toEqual({ stop: true, kind: 'hold', held: false });
  });

  test('GL 에서 직전 이동 뒤 곧 또 함께 바뀌면 morph 를 애니메이션 없이 한다. 래스터는 늘 애니메이션', () => {
    const next = { center: at(38), zoom: 12 };
    expect(
      planCamera(input({ next, gl: true, following: true })),
    ).toMatchObject({ command: { kind: 'morph', animate: false } });
    expect(
      planCamera(input({ next, gl: false, following: true })),
    ).toMatchObject({ command: { kind: 'morph', animate: true } });
    expect(
      planCamera(input({ next, gl: true, following: false })),
    ).toMatchObject({ command: { kind: 'morph', animate: true } });
  });

  test('prop 이 없으면(uncontrolled) 아무것도 넣지 않는다', () => {
    expect(planCamera(input({ next: {} })).kind).toBe('none');
  });
});

describe('EchoLog', () => {
  const same = (a: number) => (r: number) => r === a;

  test('보고한 center 는 WINDOW_MS 동안 되울림이다', () => {
    const log = new EchoLog<number>();
    log.rememberCenter(1, 0);
    expect(log.isCenterEcho(EchoLog.WINDOW_MS, same(1))).toBe(true);
    expect(log.isCenterEcho(EchoLog.WINDOW_MS + 1, same(1))).toBe(false);
    expect(log.isCenterEcho(0, same(2))).toBe(false);
  });

  test('zoom 은 실수만 기록한다', () => {
    const log = new EchoLog<number>();
    log.rememberZoom(15, 0);
    log.rememberZoom(15.5, 0);
    expect(log.isZoomEcho(15, 10)).toBe(false);
    expect(log.isZoomEcho(15.5, 10)).toBe(true);
    expect(log.isZoomEcho(15.5, EchoLog.WINDOW_MS + 1)).toBe(false);
  });

  test('MAX 개를 넘으면 오래된 것부터 버린다', () => {
    const log = new EchoLog<number>();
    for (let i = 0; i <= EchoLog.MAX; i++) log.rememberCenter(i, 0);
    expect(log.isCenterEcho(0, same(0))).toBe(false);
    expect(log.isCenterEcho(0, same(EchoLog.MAX))).toBe(true);
  });
});
