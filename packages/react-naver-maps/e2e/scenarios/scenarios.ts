import {
  calls,
  callsIn,
  circleClicked,
  controlCount,
  fired,
  kvoFollowsMap,
  mapAttached,
  markerAt,
  markerMovedFrom,
  mapWidth,
  markerClicked,
  noBacktrack,
  oneWay,
  settlesAt,
  settlesAtZoom,
  staysAfter,
  zoomReportsMatchMap,
} from './assertions.js';
import type { LL, Scenario, Step } from './types.js';

const A: LL = [37.57, 126.99];
const B: LL = [37.56, 126.96];
/** app.tsx 의 INITIAL_CENTER. Marker 도 여기 있다. */
const HOME: LL = [37.5666, 126.9784];

/** 지도를 왼쪽으로 끌고 놓은 뒤 관성이 끝날 때까지. 프레임 수는 1 + 15 + 60. */
const dragLeftAndRelease: Step[] = [
  ...drag(300, -10, 15),
  { t: 'mouse', kind: 'up', x: 150, y: 200 },
  { t: 'frames', n: 60 },
];

const rerender = (n: number): Step[] =>
  Array.from({ length: n }, (_, i): Step => ({
    t: 'props',
    props: { tick: i + 1 },
  }));

function drag(fromX: number, dx: number, moves: number): Step[] {
  return [
    { t: 'mouse', kind: 'down', x: fromX, y: 200 },
    { t: 'frames', n: 1 },
    ...Array.from({ length: moves }, (_, i): Step[] => [
      { t: 'mouse', kind: 'move', x: fromX + dx * (i + 1), y: 200 },
      { t: 'frames', n: 1 },
    ]).flat(),
  ];
}

export const scenarios: Scenario[] = [
  {
    name: 'center prop 변경은 setCenter 를 쓰지 않는다',
    app: { mode: 'props' },
    steps: [
      { t: 'props', props: { center: A } },
      { t: 'frames', n: 30 },
    ],
    expect: [settlesAt(A), calls({ panTo: 1, setCenter: 0 })],
  },
  {
    name: 'center 와 zoom 을 함께 바꾸면 morph 한 번으로 처리한다',
    app: { mode: 'props' },
    steps: [
      { t: 'props', props: { center: A, zoom: 12 } },
      { t: 'frames', n: 90 },
    ],
    expect: [
      settlesAt(A),
      settlesAtZoom(12),
      calls({ morph: 1, setZoom: 0, panTo: 0 }),
    ],
  },
  {
    name: 'panTo 도중 목표를 바꿔도 새 목표로 곧장 간다',
    app: { mode: 'props' },
    steps: [
      { t: 'call', method: 'panTo', args: [A] },
      { t: 'frames', n: 10 },
      { t: 'call', method: 'panTo', args: [B] },
      { t: 'frames', n: 110 },
    ],
    expect: [settlesAt(B), noBacktrack(B, 11)],
  },
  {
    name: 'panTo 도중 center prop 이 바뀌면 prop 값으로 끝난다',
    app: { mode: 'props' },
    steps: [
      { t: 'call', method: 'panTo', args: [A] },
      { t: 'frames', n: 10 },
      { t: 'props', props: { center: B } },
      { t: 'frames', n: 110 },
    ],
    expect: [settlesAt(B), noBacktrack(B, 11)],
  },
  {
    name: '한 프레임 안에 center prop 이 되돌아오면 처음 값에 머문다',
    app: { mode: 'props', center: A },
    steps: [
      { t: 'props', props: { center: B } },
      { t: 'props', props: { center: A } },
      { t: 'frames', n: 60 },
    ],
    expect: [settlesAt(A)],
  },
  {
    name: 'key 로 다시 만든 지도가 화면에 남는다',
    app: { mode: 'props', mapKey: 1 },
    steps: [
      { t: 'props', props: { mapKey: 2 } },
      { t: 'frames', n: 30 },
    ],
    expect: [mapAttached()],
  },
  {
    name: 'useKVO 는 지도 이동과 줌을 따라간다',
    app: { mode: 'props' },
    steps: [
      { t: 'props', props: { center: A, zoom: 13 } },
      { t: 'frames', n: 90 },
    ],
    expect: [settlesAt(A), kvoFollowsMap()],
  },
  {
    name: '값이 그대로면 재렌더해도 setter 를 부르지 않는다',
    app: { mode: 'props', polyline: true, inlineOptions: true },
    steps: [
      ...[1, 2, 3, 4, 5].map((tick): Step => ({ t: 'props', props: { tick } })),
      { t: 'frames', n: 5 },
    ],
    expect: [calls({ setPath: 0, setOptions: 0 })],
  },
  {
    name: '인라인 anchor 로 재렌더해도 InfoWindow 를 다시 열지 않는다',
    app: { mode: 'props', infoWindow: true },
    steps: [
      ...[1, 2, 3].map((tick): Step => ({ t: 'props', props: { tick } })),
      { t: 'frames', n: 5 },
    ],
    expect: [calls({ infoWindowOpen: 0, infoWindowClose: 0 })],
  },
  {
    name: 'clickable 을 나중에 켠 Marker 도 클릭을 받는다',
    app: { mode: 'props', marker: true, markerClickable: false },
    steps: [
      { t: 'props', props: { markerClickable: true } },
      { t: 'frames', n: 5 },
      { t: 'clickCenter' },
      { t: 'frames', n: 5 },
    ],
    expect: [markerClicked(1)],
  },
  {
    name: 'useAutoResize 는 영역 크기를 따라간다',
    since: '0.4',
    app: { mode: 'props', autoResize: true },
    steps: [
      { t: 'props', props: { containerWidth: 400 } },
      { t: 'realtime', ms: 200 },
      { t: 'frames', n: 5 },
    ],
    expect: [mapWidth(400)],
  },
  {
    name: 'onClick 이 있는 도형은 clickable 없이도 클릭을 받는다',
    app: { mode: 'props', circle: true },
    steps: [{ t: 'frames', n: 5 }, { t: 'clickCenter' }, { t: 'frames', n: 5 }],
    expect: [circleClicked(1), fired('click', 0)],
  },
  {
    name: 'clickable={false} 를 명시한 도형은 클릭을 받지 않는다',
    app: { mode: 'props', circle: true, circleClickable: false },
    steps: [{ t: 'frames', n: 5 }, { t: 'clickCenter' }, { t: 'frames', n: 5 }],
    expect: [circleClicked(0), fired('click', 1)],
  },
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
    // SDK 기본 컨트롤 3개 + 줌 컨트롤. StrictMode 밖에서도 4개다.
    name: 'StrictMode 에서 컨트롤이 두 벌 생기지 않는다',
    app: { mode: 'props', strict: true, zoomControl: true },
    steps: [{ t: 'frames', n: 10 }],
    expect: [controlCount(4)],
  },
  {
    name: 'gl 없으면 onZoomChanged 값은 getZoom() 과 같다',
    app: { mode: 'props' },
    steps: [
      { t: 'props', props: { zoom: 13 } },
      { t: 'frames', n: 60 },
    ],
    expect: [settlesAtZoom(13), zoomReportsMatchMap()],
  },
  {
    name: 'gl 서브모듈을 불러도 onZoomChanged 값은 getZoom() 과 같다',
    app: { mode: 'props', submodules: ['gl'] },
    steps: [
      { t: 'props', props: { zoom: 13 } },
      { t: 'frames', n: 60 },
    ],
    expect: [settlesAtZoom(13), zoomReportsMatchMap()],
  },
  // 앱 상태가 지도와 어긋나는 경우. 0.4 의 카메라·되돌림 결정(비공개 기록)을 지키는지 본다.
  {
    // 드래그 프레임(0~15) 동안에는 prop 을 지도에 넣지 않는다. 놓은 뒤 맞추는 것은 허용한다.
    name: '반올림한 center 를 되돌려줘도 드래그 중에는 지도를 당기지 않는다',
    knownIssue: '제스처 중에도 바뀐 center prop 을 바로 panTo 한다',
    app: { mode: 'rounded' },
    steps: dragLeftAndRelease,
    expect: [
      callsIn(0, 16, { panTo: 0, setCenter: 0, morph: 0 }),
      oneWay(0, 16),
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
    knownIssue: 'center 를 참조로 비교해 같은 값의 새 객체에도 panTo 한다',
    app: { mode: 'props' },
    steps: [...dragLeftAndRelease, ...rerender(1), { t: 'frames', n: 30 }],
    expect: [staysAfter(75), calls({ panTo: 0, setCenter: 0, morph: 0 })],
  },
  {
    name: '드래그한 Marker 는 다시 렌더하기 전까지 옮긴 자리에 있다',
    app: { mode: 'props', marker: true, markerDraggable: true },
    steps: [
      { t: 'frames', n: 5 },
      { t: 'mouse', kind: 'down', x: 300, y: 190 },
      { t: 'frames', n: 1 },
      ...[1, 2, 3, 4, 5, 6].flatMap((i): Step[] => [
        { t: 'mouse', kind: 'move', x: 300 + i * 10, y: 190 },
        { t: 'frames', n: 1 },
      ]),
      { t: 'mouse', kind: 'up', x: 360, y: 190 },
      { t: 'frames', n: 5 },
    ],
    expect: [markerMovedFrom(HOME), calls({ panTo: 0, setCenter: 0 })],
  },
  {
    name: '드래그한 Marker 는 다시 렌더하면 position 으로 돌아간다',
    knownIssue:
      '직전 prop 과만 비교해 SDK 쪽 변경을 되돌리지 않는다 (0.3.0 은 되돌렸다)',
    app: { mode: 'props', marker: true, markerDraggable: true },
    steps: [
      { t: 'frames', n: 5 },
      { t: 'mouse', kind: 'down', x: 300, y: 190 },
      { t: 'frames', n: 1 },
      ...[1, 2, 3, 4, 5, 6].flatMap((i): Step[] => [
        { t: 'mouse', kind: 'move', x: 300 + i * 10, y: 190 },
        { t: 'frames', n: 1 },
      ]),
      { t: 'mouse', kind: 'up', x: 360, y: 190 },
      { t: 'frames', n: 5 },
      ...rerender(1),
      { t: 'frames', n: 5 },
    ],
    expect: [markerAt(HOME)],
  },
  {
    name: '같은 좌표의 새 path 배열로 다시 렌더해도 setPath 를 부르지 않는다',
    knownIssue: '배열을 참조로 비교한다',
    app: { mode: 'props', polyline: true, polylineInline: true },
    steps: [...rerender(5), { t: 'frames', n: 5 }],
    expect: [calls({ setPath: 0 })],
  },
  {
    name: '같은 값의 새 icon 객체로 다시 렌더해도 setIcon 을 부르지 않는다',
    knownIssue: '중첩 객체(anchor)를 참조로 비교한다',
    app: { mode: 'props', marker: true, markerInlineIcon: true },
    steps: [...rerender(5), { t: 'frames', n: 5 }],
    expect: [calls({ setIcon: 0 })],
  },
];
