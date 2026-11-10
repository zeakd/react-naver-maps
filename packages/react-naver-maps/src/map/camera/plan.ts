/**
 * NaverMap 의 카메라 prop(center, zoom, bounds, centerPoint)을 지도에 어떻게 넣을지 정한다. 지도를 직접
 * 건드리지 않는 순수 함수라 규칙을 단위 테스트(`__tests__/plan.spec.ts`)로 고정한다. 정한 것을 지도에
 * 넣는 일은 `naver-map.tsx` 가 한다.
 *
 * 규칙:
 * - prop 이 지난 렌더와 값으로 같으면 넣지 않는다. 렌더마다 새로 만든 같은 값(`center={{ lat, lng }}`)도
 *   같다. 카메라는 다른 prop 과 달리 바깥 변경(사용자 드래그)을 되돌리지 않는다. 0.3.0 부터 그렇다.
 * - 바뀌었어도 지도가 이미 그 자리면 넣지 않는다. center 는 화면 1px 안이면 같은 자리다. zoom 도 함께
 *   바뀌면 더 큰 zoom 에서 잰다(zoom 7 의 1px 은 zoom 18 에서 2048px). zoom 은 SDK 가 실제로 쓸
 *   값(`sdkZoom`, 래스터는 반올림)으로 비교한다.
 * - 되울림(`echo.ts`)은 따르지 않는다.
 * - 아직 반영되지 않은 이동(panTo·morph 요청)이 있는데 prop 이 지금 자리로 돌아오면 그 이동을 멈춘다.
 *   SDK 의 panTo 는 지금 자리로의 이동을 무시해 진행 중인 이동이 끝까지 가기 때문이다.
 * - 제스처(끌기·핀치와 그 뒤 관성) 중에는 보류한다. 지난 렌더 값을 그대로 두어 제스처가 끝난 뒤 다시
 *   비교한다. 앱이 onCenterChanged 값을 가공해 되돌려주면 끄는 동안 panTo 가 지도를 끌어당겼다.
 * - 한 번에 한 명령. 우선순위: bounds > center+zoom(morph) > centerPoint > center(panTo) > zoom.
 *   center 와 zoom 을 따로 넣으면 SDK 가 중간 상태를 그려 튄다. setCenter 는 관성 이동을 끊으므로
 *   panTo(duration 0)를 쓴다.
 * - GL 에서 직전 이동 뒤 FOLLOW_MS 안에 center·zoom 이 또 함께 바뀌면 morph 를 애니메이션 없이 한다.
 *   매 프레임 바뀌는 prop(움직이는 대상 따라가기)마다 애니메이션을 새로 시작하면 prop 보다 수십 px
 *   뒤처졌다(e2e "GL 지도에서 center 와 zoom 을 매 프레임"). 래스터는 duration 0 인 morph 뒤 수백 ms 동안
 *   panTo 를 무시해서(3.10.5 실측) 쓰지 않는다.
 */
import { kvoEquals } from '../../binding/use-controlled-kvo.js';

export type CoordValue = naver.maps.Coord | naver.maps.CoordLiteral;
export type BoundsValue = naver.maps.Bounds | naver.maps.BoundsLiteral;
export type PointValue = naver.maps.Point | naver.maps.PointLiteral;

export type CameraProps = {
  center?: CoordValue;
  zoom?: number;
  bounds?: BoundsValue;
  centerPoint?: PointValue;
};

/** 판정에 필요한 지도의 지금 상태. naver-map.tsx가 지도에서 읽어 준다. */
export interface MapView {
  center(): CoordValue;
  zoom(): number;
  bounds(): BoundsValue;
  centerPoint(): PointValue;
  /** GL로 그리는가(renderMode 2). */
  gl: boolean;
  /** 두 좌표가 그 zoom에서 화면 1px 안인가. */
  sameOnScreen(a: CoordValue, b: CoordValue, zoom: number): boolean;
}

export type CameraInput = {
  /** 지난번에 넣었거나 넣지 않기로 한 prop. 보류하면 바뀌지 않는다. */
  prev: CameraProps;
  next: CameraProps;
  map: MapView;
  /** 최근 보고값과 같은 자리인가(echo.ts). */
  isCenterEcho(center: CoordValue, zoom: number): boolean;
  isZoomEcho(zoom: number): boolean;
  /** 지도에 요청했지만 아직 반영되지 않은 center가 있는가. */
  pendingMove: boolean;
  gesture: 'none' | 'active' | 'settling';
  /** 라이브러리가 마지막으로 카메라를 옮긴 뒤 FOLLOW_MS가 지나지 않았는가. */
  following: boolean;
};

export type CameraCommand =
  | { kind: 'fitBounds'; bounds: BoundsValue }
  | { kind: 'morph'; center: CoordValue; zoom: number; animate: boolean }
  | { kind: 'setCenterPoint'; centerPoint: PointValue }
  | { kind: 'panTo'; center: CoordValue }
  | { kind: 'setZoom'; zoom: number };

export type CameraPlan = {
  /** 진행 중인 이동을 멈춘다(map.stop). 보류나 명령보다 먼저 한다. */
  stop: boolean;
} & (
  | /** 넣을 것이 없다. prev 를 next 로 바꾼다. */
    { kind: 'none' }
  /** 제스처 중이라 미룬다. prev를 그대로 둔다. held 면 제스처가 끝난 뒤 다시 렌더한다. */
  | { kind: 'hold'; held: boolean }
  /** 명령 하나를 넣고 prev를 next로 바꾼다. */
  | { kind: 'move'; command: CameraCommand }
);

export const FOLLOW_MS = 1000;

/** SDK가 실제로 쓸 zoom. 래스터 지도는 실수 zoom을 반올림한다(15.46 → 15, 15.52 → 16, 3.10.5 실측). */
export function sdkZoom(gl: boolean, zoom: number): number {
  return gl ? zoom : Math.round(zoom);
}

export function planCamera(input: CameraInput): CameraPlan {
  const { prev, next, map } = input;
  let stop = false;
  const dirty: CameraProps = {};

  if (next.center !== undefined && !kvoEquals(next.center, prev.center)) {
    const zoomForCheck =
      next.zoom !== undefined && next.zoom !== prev.zoom
        ? Math.max(map.zoom(), next.zoom)
        : map.zoom();
    const atCenter = map.sameOnScreen(map.center(), next.center, zoomForCheck);
    if (atCenter && input.pendingMove) {
      stop = true;
    } else if (!atCenter && !input.isCenterEcho(next.center, zoomForCheck)) {
      dirty.center = next.center;
    }
  }
  if (next.zoom !== undefined && next.zoom !== prev.zoom) {
    if (
      map.zoom() !== sdkZoom(map.gl, next.zoom) &&
      !input.isZoomEcho(next.zoom)
    ) {
      dirty.zoom = next.zoom;
    }
  }
  if (next.bounds !== undefined && !kvoEquals(next.bounds, prev.bounds)) {
    if (!kvoEquals(map.bounds(), next.bounds)) dirty.bounds = next.bounds;
  }
  if (
    next.centerPoint !== undefined &&
    !kvoEquals(next.centerPoint, prev.centerPoint)
  ) {
    if (!kvoEquals(map.centerPoint(), next.centerPoint)) {
      dirty.centerPoint = next.centerPoint;
    }
  }

  const changed = Object.keys(dirty).length > 0;
  if (input.gesture !== 'none') return { stop, kind: 'hold', held: changed };
  if (!changed) return { stop, kind: 'none' };

  let command: CameraCommand;
  if (dirty.bounds) {
    command = { kind: 'fitBounds', bounds: dirty.bounds };
  } else if (dirty.center && dirty.zoom !== undefined) {
    command = {
      kind: 'morph',
      center: dirty.center,
      zoom: dirty.zoom,
      animate: !(map.gl && input.following),
    };
  } else if (dirty.centerPoint) {
    command = { kind: 'setCenterPoint', centerPoint: dirty.centerPoint };
  } else if (dirty.center) {
    command = { kind: 'panTo', center: dirty.center };
  } else {
    command = { kind: 'setZoom', zoom: dirty.zoom! };
  }
  return { stop, kind: 'move', command };
}
