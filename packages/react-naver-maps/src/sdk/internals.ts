/**
 * SDK 공식 문서에 없는 값을 읽는 곳. 공개 API 로 알 수 없는 것만 여기 둔다. SDK 가 이름을 바꾸면
 * 실제 SDK 계약 검사(`e2e/scenarios/sdk-routes.ts`)가 먼저 깨진다.
 */

type MapInternals = {
  _mapOptions?: naver.maps.KVO;
  isReady?: boolean;
  get?: (key: string) => unknown;
};

/**
 * Map 이 옵션을 넣어 두는 KVO. `draggable_changed` 같은 옵션 변경 이벤트는 Map 이 아니라 여기서 난다.
 * Map 이 아니면 null 이다.
 */
export function mapOptionsKvo(target: object): naver.maps.KVO | null {
  return (target as MapInternals)._mapOptions ?? null;
}

/** 지도가 init을 지났는가. 지나기 전에는 `setOptions`가 큐에 쌓이고 일부 오버레이가 붙지 않는다. */
export function isMapReady(map: object): boolean {
  return !!(map as MapInternals).isReady;
}

/**
 * GL 로 그리는가. SDK 3.10.5 의 `renderMode` 는 1 이 래스터, 2 가 GL 이다. `gl: true` 여도 WebGL 을 쓸 수
 * 없으면(성능 경고가 있는 소프트웨어 렌더) SDK 가 래스터로 바꿔 1 이다. 시나리오의 `renderMode` 필드가 이 값을 본다.
 */
export function isGlRendering(map: object): boolean {
  return (map as MapInternals).get?.('renderMode') === 2;
}
