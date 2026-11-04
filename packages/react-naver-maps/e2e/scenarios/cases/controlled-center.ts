import {
  calls,
  callsIn,
  fired,
  movedBy,
  oneWay,
  settlesAt,
  staysAfter,
} from '../assertions.js';
import type { Scenario } from '../types.js';
import { B, drag, dragLeftAndRelease, rerender } from './steps.js';

/** 앱 상태로 center 를 되돌려주는 방식(controlled·rounded·debounced)과 지도의 어긋남. 0.4 의 카메라·되돌림 결정(비공개 기록)을 지키는지 본다. */
export const controlledCenter: Scenario[] = [
  {
    name: 'controlled 드래그는 지도 메서드를 다시 부르지 않는다',
    app: { mode: 'controlled' },
    steps: [
      ...drag(300, -10, 15),
      { t: 'mouse', kind: 'up', x: 150, y: 200 },
      { t: 'frames', n: 40 },
    ],
    expect: [
      fired('dragstart', 1),
      fired('dragend', 1),
      calls({ panTo: 0, setCenter: 0, morph: 0 }),
    ],
  },
  {
    name: '드래그 중 들어온 center prop 은 드래그가 끝나면 지도에 반영된다',
    app: { mode: 'controlled' },
    steps: [
      ...drag(300, -10, 8),
      { t: 'props', props: { center: B } },
      ...drag(220, -10, 0).slice(2),
      { t: 'frames', n: 5 },
      { t: 'mouse', kind: 'up', x: 220, y: 200 },
      { t: 'frames', n: 40 },
    ],
    expect: [settlesAt(B)],
  },
  {
    // 드래그 프레임(0~15) 동안에는 prop 을 지도에 넣지 않는다. 놓은 뒤 맞추는 것은 허용한다.
    name: '반올림한 center 를 되돌려줘도 드래그 중에는 지도를 당기지 않는다',
    app: { mode: 'rounded' },
    steps: dragLeftAndRelease,
    expect: [
      callsIn(0, 16, { panTo: 0, setCenter: 0, morph: 0 }),
      oneWay(0, 16),
      movedBy(0.003, 15),
    ],
  },
  {
    name: '늦게 되돌려준 center 는 드래그 뒤 지도를 움직이지 않는다',
    app: { mode: 'debounced' },
    steps: dragLeftAndRelease,
    expect: [oneWay(), calls({ panTo: 0, setCenter: 0, morph: 0 })],
  },
  {
    name: '상태를 갱신하지 않아도 같은 center 로 다시 렌더하면 드래그한 자리에 머문다',
    app: { mode: 'props' },
    steps: [...dragLeftAndRelease, ...rerender(1), { t: 'frames', n: 30 }],
    expect: [staysAfter(75), calls({ panTo: 0, setCenter: 0, morph: 0 })],
  },
];
