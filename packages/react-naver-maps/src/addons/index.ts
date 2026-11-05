// @types/navermaps 보강 선언(타입만). 이 진입점만 가져와도 함께 들어간다(루트 index.ts 와 같다).
// oxlint-disable-next-line unicorn/require-module-specifiers
export type {} from '../sdk/navermaps-augment.js';

// SDK 에 없어서 우리가 더한 기능. 코어의 공개 API 만 쓴다.
export { useAutoResize } from './use-auto-resize.js';
