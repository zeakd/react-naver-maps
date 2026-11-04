import {
  callsIn,
  fired,
  idleAfter,
  oneWay,
  settlesAt,
  zoomReportsMatchMap,
} from '../assertions.js';
import type { Scenario } from '../types.js';
import { B, drag, pinchOut, touchDragLeftAndRelease } from './steps.js';

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

  // 숨길 때 제스처 상태가 남으면 그 뒤 카메라 prop 을 계속 보류한다.
  {
    name: '드래그 중 Activity 로 지도를 숨겼다 보이면 그 뒤 center prop 이 반영된다',
    since: '0.4',
    app: { mode: 'props' },
    steps: [
      ...drag(300, -7, 5),
      { t: 'props', props: { mapActivity: 'hidden' } },
      { t: 'mouse', kind: 'up', x: 265, y: 200 },
      { t: 'frames', n: 5 },
      { t: 'props', props: { mapActivity: 'visible' } },
      { t: 'frames', n: 30 },
      { t: 'props', props: { center: B } },
      { t: 'frames', n: 30 },
    ],
    expect: [settlesAt(B)],
  },
  // 움직이지 않은 클릭 뒤 제스처 상태가 'settling' 에 멈추면 카메라 prop 을 보류한다.
  {
    name: '누르고 움직이지 않고 떼도 다음 center prop 이 곧장 반영된다',
    app: { mode: 'props' },
    steps: [
      { t: 'clickCenter' },
      { t: 'frames', n: 5 },
      { t: 'props', props: { center: B } },
      { t: 'frames', n: 5 },
    ],
    expect: [settlesAt(B)],
  },
];
