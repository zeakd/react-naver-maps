import { camera } from './cases/camera.js';
import { controlled } from './cases/controlled.js';
import { docsAudit } from './cases/docs-audit.js';
import { gl } from './cases/gl.js';
import { lifecycle } from './cases/lifecycle.js';
import { overlays } from './cases/overlays.js';
import { stability } from './cases/stability.js';
import { stateDrift } from './cases/state-drift.js';
import { touch } from './cases/touch.js';
import type { Scenario } from './types.js';

/**
 * 실행 순서가 곧 이 배열의 순서다(비교 결과의 순서도 같다). 영역별 파일을 이어 붙이므로
 * 파일 안 순서와 파일 순서를 바꾸지 않는다. 새 시나리오는 맞는 cases/ 파일 끝에 더한다.
 */
export const scenarios: Scenario[] = [
  ...camera,
  ...stability,
  ...controlled,
  ...stateDrift,
  ...gl,
  ...touch,
  ...lifecycle,
  ...overlays,
  ...docsAudit,
];
