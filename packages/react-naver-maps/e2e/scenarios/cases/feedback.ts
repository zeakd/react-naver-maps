import {
  calls,
  callsIn,
  markerOneWay,
  movedBy,
  noBacktrack,
  oneWay,
  settlesAt,
  settlesAtZoom,
  zoomOneWay,
} from '../assertions.js';
import type { Scenario, Step } from '../types.js';
import { A, B, dragLeftAndRelease, wheels } from './steps.js';

/**
 * 되먹임이 늦게 오는 앱(onChanged 값을 몇십 ms 뒤에 상태에 넣는다)에서 생기는 튐.
 * 늦게 온 값은 지도가 이미 지나간 자리라서, 라이브러리가 그 값을 지도에 다시 적용하면 뒤로 당겨진다.
 */

/** 휠을 4프레임 간격으로 n 번 굴린 뒤 60프레임. */
/** 마커(지도 가운데, 아이콘 위쪽을 잡는다)를 왼쪽으로 15프레임 끌고 놓은 뒤 40프레임. 끄는 동안은 프레임 0~20. */
const dragMarkerLeft: Step[] = [
  { t: 'frames', n: 5 },
  { t: 'mouse', kind: 'down', x: 300, y: 190 },
  { t: 'frames', n: 1 },
  ...Array.from({ length: 15 }, (_, i): Step[] => [
    { t: 'mouse', kind: 'move', x: 300 - 7 * (i + 1), y: 190 },
    { t: 'frames', n: 1 },
  ]).flat(),
  { t: 'mouse', kind: 'up', x: 195, y: 190 },
  { t: 'frames', n: 40 },
];

const NO_STALE_CAMERA = { panTo: 0, setCenter: 0, morph: 0 };

export const feedback: Scenario[] = [
  {
    // 늦게 온 center 가 놓은 뒤 idle 에서 지도와 비교돼 panTo 로 당겨오면 뒤로 튄다.
    name: 'center 를 늦게 되돌려줘도 놓은 뒤 지도가 뒤로 당겨지지 않는다',
    app: { mode: 'delayed' },
    steps: dragLeftAndRelease,
    expect: [oneWay(), calls(NO_STALE_CAMERA), movedBy(0.003, 15)],
    since: '0.4',
  },
  {
    // 휠 줌은 보류 대상이 아니라서 늦게 온 옛 zoom 이 setZoom 으로 되돌릴 수 있다.
    name: '휠을 연달아 굴리는 동안 zoom 을 늦게 되돌려줘도 zoom 이 되돌아가지 않는다',
    app: { mode: 'controlled', zoomMode: 'delayed' },
    steps: wheels(3, 300, -100),
    expect: [zoomOneWay(), calls({ setZoom: 0, morph: 0 })],
    since: '0.4',
  },
  {
    // 줌 중심이 가운데가 아니면 줌 도중 center 도 같이 움직이는데, 그 중간 값이 늦게 돌아오면 끌려간다.
    // 확대하면 center 는 커서가 있는 오른쪽(경도 증가)으로만 움직여야 한다.
    name: '가장자리에서 휠로 확대하는 동안 center 를 늦게 되돌려줘도 줌 중심 쪽으로만 움직인다',
    app: { mode: 'delayed', zoomMode: 'delayed' },
    steps: wheels(2, 500, -100),
    expect: [oneWay(), zoomOneWay(), calls({ panTo: 0, morph: 0, setZoom: 0 })],
    since: '0.4',
  },
  {
    // SDK 자체 애니메이션이 도는 중에 늦은 center prop 이 와서 panTo 로 끊으면 목표에서 멀어진다.
    name: '사용자가 panTo 로 옮기는 동안 center 를 늦게 되돌려줘도 목표까지 끊기지 않고 간다',
    app: { mode: 'delayed' },
    steps: [
      { t: 'call', method: 'panTo', args: [A] },
      { t: 'frames', n: 90 },
    ],
    expect: [settlesAt(A), noBacktrack(A), calls({ panTo: 1, setCenter: 0 })],
    since: '0.4',
  },
  {
    name: '더블클릭 확대 애니메이션 중 center 를 늦게 되돌려줘도 지도를 끌지 않는다',
    app: { mode: 'delayed', zoomMode: 'delayed' },
    steps: [{ t: 'dblclickCenter' }, { t: 'frames', n: 90 }],
    expect: [
      zoomOneWay(),
      oneWay(),
      calls({ panTo: 0, setCenter: 0, morph: 0, setZoom: 0 }),
    ],
    since: '0.4',
  },

  {
    // 앱이 center 와 zoom 을 함께 바꾸면 morph 하나로 이동한다. 그 중간 값이 늦게 돌아와
    // 다시 적용되면 morph 가 끊기거나 목표에 못 닿는다.
    name: 'controlled 앱이 center 와 zoom 을 함께 바꾸면 morph 한 번으로 목표에 닿는다',
    app: { mode: 'controlled', zoomMode: 'controlled' },
    steps: [
      { t: 'frames', n: 5 },
      { t: 'setState', center: B, zoom: 12 },
      { t: 'frames', n: 120 },
    ],
    expect: [settlesAt(B), settlesAtZoom(12), calls({ morph: 1, panTo: 0 })],
    since: '0.4',
  },
  {
    name: '늦게 되돌려주는 앱이 center 와 zoom 을 함께 바꿔도 morph 한 번으로 목표에 닿는다',
    app: { mode: 'delayed', zoomMode: 'delayed' },
    steps: [
      { t: 'frames', n: 5 },
      { t: 'setState', center: B, zoom: 12 },
      { t: 'frames', n: 120 },
    ],
    expect: [settlesAt(B), settlesAtZoom(12), calls({ morph: 1, panTo: 0 })],
    since: '0.4',
  },
  {
    // 정책 판단: (가) 끄는 동안 바깥에서 온 position 을 SDK 에 되돌려 마커를 옛 자리로 당긴다
    // (나) 끄는 동안은 보류하고 놓은 뒤에 맞춘다. 사용자 눈에 마커가 손을 따라오는 (나)를 기대로 쓴다.
    name: '드래그 가능한 Marker 의 position 을 늦게 되돌려줘도 끄는 동안 마커가 손을 따라간다',
    app: {
      mode: 'props',
      marker: true,
      markerDraggable: true,
      markerPositionMode: 'delayed',
    },
    steps: dragMarkerLeft,
    expect: [
      markerOneWay(),
      callsIn(0, 21, { setPosition: 0 }),
      callsIn(0, 21, { panTo: 0, setCenter: 0 }),
    ],
    since: '0.4',
  },
];
