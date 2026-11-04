import {
  callsIn,
  fired,
  idleAfter,
  movedBy,
  oneWay,
  settlesAtZoom,
  zoomReportsMatchMap,
} from '../assertions.js';
import type { Scenario } from '../types.js';
import { dragLeftAndRelease } from './steps.js';

/** GL 로 그릴 때. */
export const gl: Scenario[] = [
  // GL 로 그릴 때. GPU 가 없어 SDK 가 래스터로 바꾸면 spec 이 건너뛴다.
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
      fields: ['events'],
      reason:
        'GL 의 idle 은 벡터 타일을 다 받은 뒤라 실제 네트워크 시간에 따라 프레임이 바뀐다',
    },
    app: { mode: 'rounded', roundDigits: 3, submodules: ['gl'], gl: true },
    steps: dragLeftAndRelease,
    expect: [
      callsIn(0, 16, { panTo: 0, setCenter: 0, morph: 0 }),
      movedBy(0.002, 15),
    ],
  },
];
