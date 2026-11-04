import {
  callsIn,
  fired,
  idleAfter,
  oneWay,
  zoomReportsMatchMap,
} from '../assertions.js';
import type { Scenario } from '../types.js';
import { pinchOut, touchDragLeftAndRelease } from './steps.js';

/** 사용자 입력: 터치 드래그, 핀치, 휠. 터치는 브라우저 터치 지원을 흉내 내고 CDP 로 손가락을 보낸다. */
export const gestures: Scenario[] = [
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
  {
    // 래스터 지도에서 zoom prop 만 바꾸면 효과 없이 맞춰(setZoom) 줌 효과가 없다. 사용자 휠 확대로 본다.
    name: '휠로 확대하면 줌 효과의 시작과 끝에 onZoomstart, onZoomend 가 한 번씩 온다',
    app: { mode: 'controlled' },
    steps: [
      { t: 'wheel', x: 300, y: 200, deltaY: -100 },
      { t: 'frames', n: 60 },
    ],
    expect: [
      (trace) => {
        const all = trace.flatMap((f) => f.propCalls);
        const count = (n: string) => all.filter((c) => c === n).length;
        return count('onZoomstart') === 1 && count('onZoomend') === 1
          ? null
          : `줌 이벤트 prop: ${all.join(', ') || '없음'}`;
      },
    ],
    since: '0.4',
  },
];
