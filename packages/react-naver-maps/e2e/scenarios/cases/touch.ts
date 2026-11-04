import {
  callsIn,
  fired,
  idleAfter,
  oneWay,
  zoomReportsMatchMap,
} from '../assertions.js';
import type { Scenario } from '../types.js';
import { pinchOut, touchDragLeftAndRelease } from './steps.js';

/** 터치. */
export const touch: Scenario[] = [
  // 터치. 브라우저 터치 지원을 흉내 내고 CDP 로 손가락을 보낸다.
  {
    name: '터치로 끌어 놓으면 움직임이 끝난 뒤 idle 이 한 번 온다',
    app: { mode: 'controlled', touch: true },
    steps: touchDragLeftAndRelease,
    expect: [fired('dragend', 1), idleAfter('dragend'), oneWay()],
  },
  {
    name: '핀치로 zoom 이 바뀌면 onZoomChanged 가 getZoom() 과 같다',
    app: { mode: 'controlled', touch: true },
    steps: pinchOut,
    expect: [zoomReportsMatchMap(), idleAfter('zoom_changed')],
  },
  {
    name: '터치로 끄는 중 반올림한 center 를 되돌려줘도 지도를 당기지 않는다',
    app: { mode: 'rounded', touch: true },
    steps: touchDragLeftAndRelease,
    expect: [callsIn(0, 16, { panTo: 0, setCenter: 0, morph: 0 })],
  },
];
