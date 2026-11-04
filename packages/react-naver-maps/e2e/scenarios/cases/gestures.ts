import {
  callsIn,
  fired,
  idleAfter,
  movedBy,
  oneWay,
  settlesAt,
  zoomReportsMatchMap,
} from '../assertions.js';
import type { Scenario, Step } from '../types.js';
import { B, drag, pinchOut, touchDragLeftAndRelease } from './steps.js';

/** 사용자 입력: 터치 드래그, 핀치, 휠. 터치는 브라우저 터치 지원을 흉내 내고 CDP 로 손가락을 보낸다. */
/**
 * 두 손가락으로 벌리다가 오른쪽 손가락을 떼고 왼쪽 손가락으로 계속 끈다. 프레임 0 시작, 1~4 벌림,
 * 5 에 한 손가락을 떼고 6~20 에 끈다. 손가락 번호는 점 배열의 순서라(playwright-driver) 점을 하나만 보내면
 * 첫 점의 손가락이 남고 둘째가 떨어진다(CDP 가 이전 이벤트와 비교해 뗀 점을 만든다. 추정).
 */
const pinchThenOneFingerDrag: Step[] = [
  {
    t: 'touch',
    kind: 'start',
    points: [
      [250, 200],
      [350, 200],
    ],
  },
  { t: 'frames', n: 1 },
  ...Array.from({ length: 4 }, (_, i): Step[] => [
    {
      t: 'touch',
      kind: 'move',
      points: [
        [250 - 8 * (i + 1), 200],
        [350 + 8 * (i + 1), 200],
      ],
    },
    { t: 'frames', n: 1 },
  ]).flat(),
  { t: 'touch', kind: 'move', points: [[218, 200]] },
  { t: 'frames', n: 1 },
  ...Array.from({ length: 15 }, (_, i): Step[] => [
    { t: 'touch', kind: 'move', points: [[218 - 7 * (i + 1), 200]] },
    { t: 'frames', n: 1 },
  ]).flat(),
  { t: 'touch', kind: 'end', points: [] },
  { t: 'frames', n: 30 },
];

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

  // QC(research/qc-cases #1): 숨길 때 제스처 상태가 남으면 그 뒤 카메라 prop 을 계속 보류한다.
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
  // QC #2: 움직이지 않은 클릭 뒤 제스처 상태가 'settling' 에 멈추면 카메라 prop 을 보류한다.
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
  // QC 사례 13. 핀치가 끝난 상태가 한 손가락 드래그 중에도 남으면 반올림 되먹임이 지도를 당긴다.
  {
    name: '핀치하다 한 손가락을 떼고 계속 끌 때 반올림한 center 를 되돌려줘도 지도를 당기지 않는다',
    since: '0.4',
    app: { mode: 'rounded', touch: true },
    steps: pinchThenOneFingerDrag,
    expect: [
      callsIn(6, 21, { panTo: 0, setCenter: 0, morph: 0 }),
      oneWay(6, 21),
      // 끌기가 실제로 먹혔는지(한 손가락 끌기가 안 보내졌으면 위 판정이 비어 통과한다).
      movedBy(0.001, 20),
    ],
  },
];
