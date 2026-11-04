import {
  calls,
  callsIn,
  circleClicked,
  controlCount,
  customControlAt,
  customControlText,
  drawn,
  dataLayer,
  fired,
  groundOverlaysCreated,
  heatMapOpacity,
  probedAt,
  probedAtLeast,
  idleAfter,
  kvoFollowsMap,
  mapAttached,
  markerAt,
  markerMovedFrom,
  markerOnMap,
  movedBy,
  mapWidth,
  markerClicked,
  noBacktrack,
  oneWay,
  overlaysOnMap,
  sameMap,
  settlesAt,
  settlesAtZoom,
  staysAfter,
  zoomReportsMatchMap,
  lastFrame,
  frameAt,
} from './assertions.js';
import type { LL, Scenario, Step } from './types.js';

const A: LL = [37.57, 126.99];
const B: LL = [37.56, 126.96];
/** app.tsx 의 INITIAL_CENTER. Marker 도 여기 있다. */
const HOME: LL = [37.5666, 126.9784];

/**
 * 지도를 왼쪽으로 끌고 놓은 뒤 관성이 끝날 때까지. 프레임 수는 1 + 15 + 60.
 * 한 번에 7px 씩 민다. 10px 이면 zoom 15 에서 경도가 소수 넷째 자리에 딱 맞아 반올림해도
 * 값이 같아진다(GL 에서 관찰).
 */
const dragLeftAndRelease: Step[] = [
  ...drag(300, -7, 15),
  { t: 'mouse', kind: 'up', x: 195, y: 200 },
  { t: 'frames', n: 60 },
];

/**
 * 한 손가락으로 왼쪽으로 끌고 뗀 뒤 60프레임. 프레임 수는 1 + 15 + 60.
 * 처음 두 번의 touchmove 는 touch slop 안이라 페이지에 가지 않아 dragstart 는 프레임 3 에 온다.
 */
const touchDragLeftAndRelease: Step[] = [
  { t: 'touch', kind: 'start', points: [[300, 200]] },
  { t: 'frames', n: 1 },
  ...Array.from({ length: 15 }, (_, i): Step[] => [
    { t: 'touch', kind: 'move', points: [[300 - 7 * (i + 1), 200]] },
    { t: 'frames', n: 1 },
  ]).flat(),
  { t: 'touch', kind: 'end', points: [] },
  { t: 'frames', n: 60 },
];

/** 두 손가락을 벌린 뒤 60프레임. */
const pinchOut: Step[] = [
  {
    t: 'touch',
    kind: 'start',
    points: [
      [250, 200],
      [350, 200],
    ],
  },
  { t: 'frames', n: 1 },
  ...Array.from({ length: 10 }, (_, i): Step[] => [
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
  { t: 'touch', kind: 'end', points: [] },
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
    app: { mode: 'props', polyline: true, polylineInline: true },
    steps: [...rerender(5), { t: 'frames', n: 5 }],
    expect: [calls({ setPath: 0 })],
  },
  {
    name: '같은 값의 새 icon 객체로 다시 렌더해도 setIcon 을 부르지 않는다',
    app: { mode: 'props', marker: true, markerInlineIcon: true },
    steps: [...rerender(5), { t: 'frames', n: 5 }],
    expect: [calls({ setIcon: 0 })],
  },
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
  // 수명. 지도와 오버레이 인스턴스가 React 의 suspend, Activity 를 지나도 살아 있는지 본다.
  {
    name: '지도 안의 자식이 suspend 했다 풀려도 같은 지도에 Marker 가 붙어 있다',
    unstable: {
      fields: ['controls'],
      reason:
        '다시 만든 지도의 init 이 스타일 메타데이터 응답을 기다려 컨트롤이 붙는 프레임이 실행마다 다르다',
    },
    app: { mode: 'props', marker: true },
    steps: [
      { t: 'frames', n: 2 },
      { t: 'props', props: { suspendKey: 1 } },
      { t: 'frames', n: 30 },
    ],
    expect: [sameMap(), mapAttached(), markerOnMap(true), settlesAt(HOME)],
  },
  {
    name: 'Activity 로 지도를 숨겼다 보이면 같은 지도가 같은 크기와 center 로 돌아온다',
    app: { mode: 'props', marker: true },
    steps: [
      { t: 'frames', n: 2 },
      { t: 'props', props: { mapActivity: 'hidden' } },
      { t: 'frames', n: 5 },
      { t: 'props', props: { mapActivity: 'visible' } },
      { t: 'frames', n: 20 },
    ],
    expect: [
      sameMap(),
      mapAttached(),
      mapWidth(600),
      settlesAt(HOME),
      markerOnMap(true),
    ],
  },
  {
    name: 'Activity 로 Marker 를 숨기면 지도에서 떨어지고 보이면 다시 붙는다',
    app: { mode: 'props', marker: true },
    steps: [
      { t: 'frames', n: 2 },
      { t: 'props', props: { markerActivity: 'hidden' } },
      { t: 'frames', n: 5 },
      { t: 'props', props: { markerActivity: 'visible' } },
      { t: 'frames', n: 5 },
    ],
    expect: [markerOnMap(false, 6), markerOnMap(true)],
  },
  {
    name: 'Activity 로 도형과 열린 InfoWindow 를 숨겼다 보이면 같은 지도에 다시 붙고 다시 열린다',
    app: { mode: 'props', polyline: true, circle: true, infoWindow: true },
    steps: [
      { t: 'frames', n: 2 },
      { t: 'props', props: { overlaysActivity: 'hidden' } },
      { t: 'frames', n: 5 },
      { t: 'props', props: { overlaysActivity: 'visible' } },
      { t: 'frames', n: 5 },
    ],
    expect: [
      overlaysOnMap(['circle', 'infoWindow', 'polyline'], 0),
      overlaysOnMap([], 6),
      overlaysOnMap(['circle', 'infoWindow', 'polyline']),
      sameMap(),
    ],
  },
  {
    name: '같은 값의 새 bounds 로 다시 렌더해도 GroundOverlay 를 다시 만들지 않고 url 이 바뀌면 만든다',
    app: {
      mode: 'props',
      groundOverlayUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
    },
    steps: [
      ...rerender(3),
      { t: 'frames', n: 2 },
      {
        t: 'props',
        props: {
          groundOverlayUrl:
            'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACw=',
        },
      },
      { t: 'frames', n: 2 },
    ],
    expect: [groundOverlaysCreated(2)],
  },
  {
    name: 'BicycleLayer 는 지도에 붙고 언마운트하면 떨어진다',
    since: '0.4',
    app: { mode: 'props', bicycleLayer: true },
    steps: [
      { t: 'frames', n: 2 },
      { t: 'props', props: { bicycleLayer: false } },
      { t: 'frames', n: 2 },
    ],
    expect: [overlaysOnMap(['bicycle'], 0), overlaysOnMap([])],
  },
  {
    // Position: TOP_LEFT 1, TOP_RIGHT 3. 지도와 함께 마운트해 init 전에 붙이는 경우도 지난다.
    name: 'CustomControl 은 React 내용을 컨트롤 자리에 그리고 position 을 바꾸면 옮기고 언마운트하면 뺀다',
    since: '0.4',
    app: { mode: 'props', customControlPosition: 1 },
    steps: [
      { t: 'frames', n: 2 },
      { t: 'props', props: { customControlPosition: 3 } },
      { t: 'frames', n: 2 },
      { t: 'props', props: { customControlPosition: undefined } },
      { t: 'frames', n: 2 },
    ],
    expect: [
      customControlAt(1, 0),
      customControlAt(3, 2),
      customControlAt(null),
      customControlText('처음 위치', 0),
    ],
  },
  {
    name: 'GeoJson 은 데이터 레이어에 feature 를 올리고 style 을 바꾸면 다시 칠하고 클릭에 feature 를 주고 언마운트하면 뺀다',
    since: '0.4',
    app: { mode: 'props', geoJsonFill: '#ff0000' },
    steps: [
      { t: 'frames', n: 2 },
      { t: 'props', props: { geoJsonFill: '#0000ff' } },
      { t: 'frames', n: 2 },
      { t: 'clickCenter' },
      { t: 'frames', n: 2 },
      { t: 'props', props: { geoJsonFill: undefined } },
      { t: 'frames', n: 2 },
    ],
    expect: [
      dataLayer({ features: 1, fillColor: '#ff0000' }, 0),
      dataLayer({ features: 1, fillColor: '#0000ff', clicks: 1 }, 5),
      dataLayer({ features: 0 }),
    ],
  },
  {
    name: 'HeatMap 은 visualization 서브모듈로 지도에 붙고 opacity 를 바꾸면 따르고 언마운트하면 떨어진다',
    since: '0.4',
    app: { mode: 'props', submodules: ['visualization'], heatMapOpacity: 0.6 },
    steps: [
      { t: 'frames', n: 2 },
      { t: 'realtime', ms: 1500 },
      { t: 'frames', n: 60 },
      { t: 'shot', name: 'heatmap' },
      { t: 'probe', name: 'centerRed' },
      { t: 'props', props: { heatMapOpacity: 0.3 } },
      { t: 'frames', n: 2 },
      { t: 'props', props: { heatMapOpacity: undefined } },
      { t: 'frames', n: 2 },
    ],
    expect: [
      overlaysOnMap(['heatMap'], 0),
      probedAtLeast('centerRed', 50),
      heatMapOpacity(0.3, 63),
      overlaysOnMap([]),
    ],
  },
  {
    // DrawingMode.MARKER 는 6. 지도를 한 번 누르면 Marker 하나를 그린다.
    name: 'DrawingManager 로 마커 모드에서 지도를 누르면 도형이 생기고 onDrawingAdded 가 온다',
    since: '0.4',
    app: { mode: 'props', submodules: ['drawing'], drawingMode: 6 },
    steps: [{ t: 'frames', n: 5 }, { t: 'clickCenter' }, { t: 'frames', n: 5 }],
    expect: [drawn({ drawings: 1, added: 1 })],
  },
  {
    // 빨강으로 찍고 화면 가운데 빨강을 센다. 다른 색으로 바꾸면 빨강이 사라져야 한다.
    name: 'DotMap 은 visualization 서브모듈로 점을 그리고 fillColor 를 바꾸면 다시 칠하고 언마운트하면 떨어진다',
    since: '0.4',
    app: {
      mode: 'props',
      submodules: ['visualization'],
      dotMapFill: '#ff0000',
    },
    steps: [
      { t: 'frames', n: 2 },
      { t: 'realtime', ms: 1500 },
      { t: 'frames', n: 30 },
      { t: 'shot', name: 'dotmap-red' },
      { t: 'probe', name: 'centerRed' },
      { t: 'props', props: { dotMapFill: '#0000ff' } },
      { t: 'realtime', ms: 1000 },
      { t: 'frames', n: 30 },
      { t: 'shot', name: 'dotmap-blue' },
      { t: 'probe', name: 'centerRed' },
      { t: 'props', props: { dotMapFill: undefined } },
      { t: 'frames', n: 2 },
    ],
    expect: [
      overlaysOnMap(['dotMap'], 0),
      probedAt('centerRed', 0, (v) => v >= 50),
      probedAt('centerRed', 1, (v) => v < 10),
      overlaysOnMap([]),
    ],
  },
  // 공식 문서 전수 대조(2026-11-04)에서 나온 동작
  {
    name: 'DROP 이 끝난 Marker 를 다시 렌더해도 다시 떨어지지 않는다',
    app: { mode: 'props', marker: true, markerAnimation: 2 },
    steps: [{ t: 'frames', n: 90 }, ...rerender(3), { t: 'frames', n: 5 }],
    expect: [calls({ setAnimation: 0 }), lastFrame('markerAnimation', null)],
  },
  {
    name: 'animation 을 null 로 바꾸면 BOUNCE 가 멈춘다',
    app: { mode: 'props', marker: true, markerAnimation: 1 },
    steps: [
      { t: 'frames', n: 10 },
      { t: 'props', props: { markerAnimation: null } },
      { t: 'frames', n: 5 },
    ],
    expect: [calls({ setAnimation: 1 }), lastFrame('markerAnimation', null)],
  },
  {
    name: 'cursor 를 주고 올리면 지도 위 커서가 그 값이다',
    app: { mode: 'props', mapCursor: 'crosshair' },
    steps: [{ t: 'frames', n: 2 }],
    expect: [lastFrame('mapCursor', 'crosshair')],
  },
  {
    // KVO 객체는 참조로 비교한다. 예전에는 키마다 훑다가 순환 참조로 스택이 넘쳤다.
    // 렌더마다 새로 만들면 새 값이라 매번 넣는다(앱은 useMemo 로 한 번 만든다).
    name: '렌더마다 새 MapTypeRegistry 를 넘겨도 에러 없이 같은 지도로 남는다',
    app: { mode: 'props', mapTypesInline: true },
    steps: [...rerender(3), { t: 'frames', n: 3 }],
    expect: [sameMap()],
  },
  {
    name: 'Kml 은 KML 문서의 feature 를 올리고 문서를 바꾸면 갈아 끼우고 언마운트하면 뺀다',
    app: { mode: 'props', kml: 'point' },
    steps: [
      { t: 'frames', n: 2 },
      ...rerender(2),
      { t: 'frames', n: 2 },
      { t: 'props', props: { kml: 'line' } },
      { t: 'frames', n: 2 },
      { t: 'props', props: { kml: undefined } },
      { t: 'frames', n: 2 },
    ],
    expect: [
      // 프레임: 0-1 point, 2-3 같은 문서로 다시 렌더, 4-5 line, 6-7 언마운트
      dataLayer({ features: 1 }, 1),
      dataLayer({ features: 1 }, 3),
      dataLayer({ features: 2 }, 5),
      dataLayer({ features: 0 }),
    ],
    since: '0.4',
  },
  {
    name: 'LabelLayer 는 지도에 붙고 언마운트하면 떨어진다',
    app: { mode: 'props', labelLayer: true },
    steps: [
      { t: 'frames', n: 2 },
      { t: 'props', props: { labelLayer: false } },
      { t: 'frames', n: 2 },
    ],
    expect: [overlaysOnMap(['label'], 1), overlaysOnMap([])],
    since: '0.4',
  },
  {
    name: 'Layer 는 사용자 지도 유형의 타일을 그리고 같은 값으로 다시 렌더하면 그대로, zIndex 를 바꾸면 다시 만든다',
    app: { mode: 'props', tileGridZIndex: 1 },
    steps: [
      { t: 'frames', n: 2 },
      { t: 'realtime', ms: 300 },
      { t: 'frames', n: 2 },
      ...rerender(2),
      { t: 'frames', n: 2 },
      { t: 'props', props: { tileGridZIndex: 2 } },
      { t: 'frames', n: 2 },
      { t: 'props', props: { tileGridZIndex: undefined } },
      { t: 'frames', n: 2 },
    ],
    expect: [
      // 프레임: 0-3 처음, 4-5 다시 렌더, 6-7 zIndex 2, 8-9 언마운트
      overlaysOnMap(['tileGrid'], 3),
      frameAt(3, 'tileGridCells', (v) => v > 0),
      frameAt(5, 'layersCreated', (v) => v === 1),
      frameAt(7, 'layersCreated', (v) => v === 2),
      overlaysOnMap([]),
      frameAt(9, 'tileGridCells', (v) => v === 0),
    ],
    since: '0.4',
  },
  {
    name: 'Gpx 는 GPX 트랙을 올리고 언마운트하면 뺀다',
    app: { mode: 'props', gpx: true },
    steps: [
      { t: 'frames', n: 2 },
      { t: 'props', props: { gpx: false } },
      { t: 'frames', n: 2 },
    ],
    expect: [dataLayer({ features: 1 }, 1), dataLayer({ features: 0 })],
    since: '0.4',
  },
  {
    // zoom prop 은 효과 없이 맞추므로(setZoom) 줌 효과가 없다. 사용자 휠 확대로 본다.
    name: '휠로 확대하면 줌 효과의 시작과 끝에 onZoomstart, onZoomend 가 한 번씩 온다',
    app: { mode: 'controlled' },
    steps: [
      { t: 'wheel', x: 300, y: 200, deltaY: -100 },
      { t: 'frames', n: 60 },
    ],
    expect: [calls({ onZoomstart: 1, onZoomend: 1 })],
    since: '0.4',
  },
  {
    name: 'FlightSpot 은 panorama 서브모듈로 지도에 붙고 언마운트하면 떨어진다',
    app: { mode: 'props', submodules: ['panorama'], flightSpot: true, zoom: 6 },
    steps: [
      { t: 'frames', n: 2 },
      { t: 'realtime', ms: 1000 },
      { t: 'frames', n: 2 },
      { t: 'shot', name: 'flightspot' },
      { t: 'props', props: { flightSpot: false } },
      { t: 'frames', n: 2 },
    ],
    expect: [overlaysOnMap(['flightSpot'], 3), overlaysOnMap([])],
    since: '0.4',
  },
  {
    name: 'HeatMap 은 공식 튜토리얼의 { weight, location } 데이터도 그린다',
    since: '0.4',
    app: {
      mode: 'props',
      submodules: ['visualization'],
      heatMapOpacity: 0.6,
      heatMapWeighted: true,
    },
    steps: [
      { t: 'frames', n: 2 },
      { t: 'realtime', ms: 1500 },
      { t: 'frames', n: 60 },
      { t: 'probe', name: 'centerRed' },
    ],
    expect: [overlaysOnMap(['heatMap']), probedAtLeast('centerRed', 50)],
  },
  {
    // SDK 는 리터럴 좌표를 지금 지도 유형의 투영으로 바꾸는데, 투영을 생략한 유형이면 던졌다.
    name: '투영을 생략한 사용자 지도 유형에서도 리터럴 center 로 올리고 옮긴다',
    since: '0.4',
    app: { mode: 'props', projectionlessMapType: true },
    steps: [
      { t: 'frames', n: 2 },
      { t: 'props', props: { center: A } },
      { t: 'frames', n: 5 },
    ],
    expect: [sameMap()],
  },
];
