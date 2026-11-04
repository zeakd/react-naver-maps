// 시나리오 앱이 검사할 라이브러리. 기본은 이 저장소의 소스이고,
// 비교 실행(`e2e/compare.ts`)에서는 Vite 가 이 파일을 배포된 버전의 진입점으로 바꿔 끼운다
// (`scenarios/vite.config.ts`). 그래서 앱은 이 파일만 import 한다.
export * from '../../src/core/react-naver-maps.js';
export { loadScript } from '../../src/core/load-script.js';
export { useAutoResize } from '../../src/addons/index.js';
export { geocode, reverseGeocode } from '../../src/geocoder/index.js';
export { DotMap, HeatMap } from '../../src/visualization/index.js';
export { DrawingManager } from '../../src/drawing/index.js';
export { Panorama } from '../../src/panorama/index.js';

/** 검사 대상의 이름. 배포 버전으로 바꿔 끼우면 그 버전 문자열이 된다. */
export const TARGET = 'source';
