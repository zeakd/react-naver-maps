import {
  calls,
  circleClicked,
  controlCount,
  fired,
  kvoFollowsMap,
  mapAttached,
  mapWidth,
  markerClicked,
  noBacktrack,
  settlesAt,
  settlesAtZoom,
  zoomReportsMatchMap,
} from './assertions.js';
import type { LL, Scenario, Step } from './types.js';

const A: LL = [37.57, 126.99];
const B: LL = [37.56, 126.96];

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
];
