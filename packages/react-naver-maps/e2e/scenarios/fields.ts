// 프레임 필드마다 비교 실행(`e2e/compare.ts`)이 두 궤적을 어떻게 견줄지. 필드를 선언하는 곳 옆에 적는다:
// 지도 본체는 `types.ts` 의 CORE_FIELDS, 기능은 각 픽스처의 `fields`(`app/fixture.tsx`).
// 빠뜨리면 tsc 가 실패하고, 실행 중 분류 없는 필드가 궤적에 나오면 비교가 실패한다. 분류는 실행이
// 보고서에 `fields.json` 으로 붙인다.
//
// measured·pixels 로 둘 근거는 같은 코드끼리 돌린 비교(`compare:scenarios harness:HEAD`)에서 실제로
// 흔들린 필드다. 흔들리지 않는 값을 measured 로 두면 그 필드의 동작 차이를 놓친다.

/**
 * - `behavior`: 동작. 두 궤적에서 정확히 같아야 한다.
 * - `pixels`: 화면 픽셀을 센 값의 묶음(이름 → 수). 캔버스 렌더 때문에 같은 코드에서도 1~2px 흔들려
 *   max(3px, 1%) 안이면 같다고 본다(2026-11-04 같은 커밋끼리 네 번 실행해 확인).
 * - `measured`: 기기·부하·SDK 내부 시점에 따라 달라지는 측정값. 비교하지 않고 시나리오의 expect 가 판정한다.
 * - `{ since }`: 그 버전(`major.minor`)에 생긴 API 의 기록이라 더 오래된 배포본에는 늘 비어 있다. 그런
 *   배포본과는 비교하지 않고, 나머지 기준선과는 behavior 로 견준다.
 */
export type FieldKind = 'behavior' | 'pixels' | 'measured' | { since: string };

/** 프레임 타입 F 의 모든 필드(선택 필드 포함)에 분류를 요구한다. */
export type FieldKinds<F> = { [K in keyof F]-?: FieldKind };
