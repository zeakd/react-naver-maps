import type { LL } from '../types.js';

// Maps 키. Web 서비스 URL 에 http://localhost:4321 이 등록되어 있다.
export const NCP_KEY_ID = 'aluya4ff04';
export const INITIAL_CENTER: LL = [37.5666, 126.9784];
export const INITIAL_ZOOM = 15;

export function toCoord(ll: LL) {
  return { lat: ll[0], lng: ll[1] };
}
