/**
 * SDK 서브모듈. `NavermapsProvider submodules` 로 불러야 쓸 수 있다.
 * 각 이름은 불러오면 생기는 네임스페이스로 확인한다(3.10.5).
 */
const PRESENCE = {
  geocoder: (maps: typeof naver.maps) => 'Service' in maps,
  visualization: (maps: typeof naver.maps) => 'visualization' in maps,
  drawing: (maps: typeof naver.maps) => 'drawing' in maps,
  panorama: (maps: typeof naver.maps) => 'Panorama' in maps,
} as const;

export type Submodule = keyof typeof PRESENCE;

/**
 * 서브모듈이 없으면 어떻게 불러야 하는지 알려 주는 에러를 던진다. 조용히 아무것도 안 그리는
 * 대신 원인을 바로 보이게 한다. 서브모듈은 스크립트 URL 로 정해지고 나중에 더 불러오는 규칙은
 * SDK 의 공개 계약이 아니라서 라이브러리가 대신 불러오지 않는다.
 */
export function requireSubmodule(
  maps: typeof naver.maps,
  submodule: Submodule,
  usedBy: string,
): void {
  if (PRESENCE[submodule](maps)) return;
  throw new Error(
    `[react-naver-maps] ${usedBy} 는 ${submodule} 서브모듈이 필요합니다. <NavermapsProvider submodules={['${submodule}']}> 로 불러오세요.\n` +
      `${usedBy} needs the ${submodule} submodule. Load it with <NavermapsProvider submodules={['${submodule}']}>.`,
  );
}
