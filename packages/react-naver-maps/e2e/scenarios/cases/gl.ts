import {
  calls,
  callsIn,
  followsProps,
  settlesAt,
  zoomOneWay,
  fired,
  idleAfter,
  movedBy,
  oneWay,
  settlesAtZoom,
  zoomReportsMatchMap,
} from '../assertions.js';
import type { Scenario } from '../types.js';
import { dragLeftAndRelease, everyFrame, HOME, wheels } from './steps.js';

/** GL 로 그릴 때. GPU 가 없어 SDK 가 래스터로 바꾸면 spec 이 건너뛴다. */
export const gl: Scenario[] = [
  {
    name: 'GL 지도를 끌어 놓으면 움직임이 끝난 뒤 idle 이 한 번 온다',
    unstable: {
      fields: ['events'],
      reason:
        'GL 의 idle 은 벡터 타일을 다 받은 뒤라 실제 네트워크 시간에 따라 프레임이 바뀐다',
    },
    app: { mode: 'controlled', submodules: ['gl'], gl: true },
    steps: [
      ...dragLeftAndRelease.slice(0, -1),
      { t: 'shot', name: 'released' },
      { t: 'frames', n: 60 },
      { t: 'shot', name: 'settled' },
    ],
    expect: [fired('dragend', 1), idleAfter('dragend'), oneWay()],
  },
  {
    name: 'GL 지도에서 zoom prop 을 바꾸면 그 zoom 이 되고 onZoomChanged 도 같다',
    unstable: {
      fields: ['events'],
      reason:
        'GL 의 idle 은 벡터 타일을 다 받은 뒤라 실제 네트워크 시간에 따라 프레임이 바뀐다',
    },
    app: { mode: 'props', submodules: ['gl'], gl: true },
    steps: [
      { t: 'props', props: { zoom: 13 } },
      { t: 'frames', n: 60 },
    ],
    expect: [settlesAtZoom(13), zoomReportsMatchMap()],
  },
  {
    // GL 의 getCenter() 는 드래그 중 0.0002 도 단위로 움직여 넷째 자리 반올림으로는 값이 그대로다.
    name: 'GL 지도에서 반올림한 center 를 되돌려줘도 드래그 중에는 지도를 당기지 않는다',
    unstable: {
      fields: ['events', 'center', 'calls', 'kvoLat', 'propCenter'],
      reason:
        'GL 의 idle 은 벡터 타일을 다 받은 뒤라 실제 네트워크 시간에 따라 프레임이 바뀐다. 놓은 뒤 마지막으로 보고된 center 도 GL 렌더 시점에 따라 달라 반올림 값을 되돌릴 때 panTo 가 있거나 없다(같은 커밋끼리 4회 중 1회). 드래그 중 당기지 않는다는 판정은 expect 가 본다. propCenter 는 그 center 를 반올림해 되돌려준 값이라 함께 흔들린다',
    },
    app: { mode: 'rounded', roundDigits: 3, submodules: ['gl'], gl: true },
    steps: dragLeftAndRelease,
    expect: [
      callsIn(0, 16, { panTo: 0, setCenter: 0, morph: 0 }),
      movedBy(0.002, 15),
    ],
  },
  // 늦은 되먹임·매 프레임 따라오기의 GL 판(feedback.ts, camera.ts). GL 은 실수 zoom 을 그대로 쓰고
  // 그리는 시점이 래스터와 달라 따로 본다.
  {
    name: 'GL 지도에서 center 를 늦게 되돌려줘도 놓은 뒤 지도가 뒤로 당겨지지 않는다',
    since: '0.4',
    unstable: {
      fields: ['events'],
      reason:
        'GL 의 idle 은 벡터 타일을 다 받은 뒤라 실제 네트워크 시간에 따라 프레임이 바뀐다',
    },
    app: { mode: 'delayed', submodules: ['gl'], gl: true },
    steps: dragLeftAndRelease,
    expect: [oneWay(), calls({ panTo: 0, setCenter: 0, morph: 0 })],
  },
  {
    name: 'GL 지도에서 휠을 연달아 굴리는 동안 zoom 을 늦게 되돌려줘도 zoom 이 되돌아가지 않는다',
    since: '0.4',
    unstable: {
      fields: ['events'],
      reason:
        'GL 의 idle 은 벡터 타일을 다 받은 뒤라 실제 네트워크 시간에 따라 프레임이 바뀐다',
    },
    app: {
      mode: 'controlled',
      zoomMode: 'delayed',
      submodules: ['gl'],
      gl: true,
    },
    steps: wheels(3, 300, -100),
    expect: [zoomOneWay(), calls({ setZoom: 0, morph: 0 })],
  },
  {
    name: 'GL 지도에서 center 와 zoom 을 매 프레임 함께 바꾸면 지도가 매 프레임 그 prop 을 따른다',
    since: '0.4',
    unstable: {
      fields: ['events'],
      reason:
        'GL 의 idle 은 벡터 타일을 다 받은 뒤라 실제 네트워크 시간에 따라 프레임이 바뀐다',
    },
    app: { mode: 'props', submodules: ['gl'], gl: true },
    steps: [{ t: 'frames', n: 2 }, ...everyFrame, { t: 'frames', n: 90 }],
    // 첫 변경(프레임 2)은 따로 떨어진 변경이라 애니메이션한다. 그 뒤로는 매 프레임 따라온다.
    expect: [
      followsProps(3),
      settlesAt([HOME[0] + 0.00005 * 30, HOME[1] + 0.0002 * 30]),
    ],
  },
];
