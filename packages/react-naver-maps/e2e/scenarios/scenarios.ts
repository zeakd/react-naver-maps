import { camera } from './cases/camera.js';
import { controlledCenter } from './cases/controlled-center.js';
import { controls } from './cases/controls.js';
import { feedback } from './cases/feedback.js';
import { gestures } from './cases/gestures.js';
import { gl } from './cases/gl.js';
import { layersData } from './cases/layers-data.js';
import { lifecycle } from './cases/lifecycle.js';
import { mapProps } from './cases/map-props.js';
import { overlays } from './cases/overlays.js';
import { reactLifecycle } from './cases/react-lifecycle.js';
import { submodules } from './cases/submodules.js';
import type { Scenario } from './types.js';

/**
 * 영역별 cases/ 파일을 모은다. 비교 실행기는 시나리오를 이름으로 맞추고 각 시나리오는 새 페이지에서
 * 돌므로 순서에 기대지 않는다. 새 시나리오는 영역에 맞는 cases/ 파일에 더한다(이름은 유일해야 한다).
 */
export const scenarios: Scenario[] = [
  ...camera,
  ...mapProps,
  ...controlledCenter,
  ...feedback,
  ...gestures,
  ...gl,
  ...lifecycle,
  ...reactLifecycle,
  ...overlays,
  ...controls,
  ...layersData,
  ...submodules,
];
