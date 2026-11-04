import {
  calls,
  customControlAt,
  frameAt,
  infoWindowAlwaysOpen,
  infoWindowAtAnchor,
  lastFrame,
  mapAttached,
  mapVisible,
  noErrors,
  overlaysOnMap,
  sameMap,
} from '../assertions.js';
import type { Scenario, Step } from '../types.js';
import { B, drag } from './steps.js';

/**
 * React 수명이 SDK 인스턴스에 미치는 영향: init 전에 내린 자식, key 로 다시 만든 anchor, transition 안의
 * suspend, 지도를 내리는 순간의 SDK 작업, 지도 안의 에러 경계.
 */

/** init 을 기다리지 않고 단계를 시작한다. */
const BEFORE_INIT = { waitInit: false };

/** 스타일 메타데이터 응답을 늦춰 init 을 미루는 시간(실제 ms). init 전 단계가 돌 만큼 길다. */
const INIT_DELAY_MS = 2000;

/** 지도를 왼쪽으로 15프레임 끌고 놓은 직후 3프레임(관성이 도는 중). */
const dragAndRelease: Step[] = [
  ...drag(300, -7, 15),
  { t: 'mouse', kind: 'up', x: 195, y: 200 },
  { t: 'frames', n: 3 },
];

export const reactLifecycle: Scenario[] = [
  // init 전에 올렸다 내린 자식이 init 뒤에 붙으면 안 된다.
  // 어느 요청이 init 을 막는지는 브라우저로 확인하지 못했다. 주소는 playwright-driver 의 STYLE_URL(추정).
  {
    name: 'init 전에 올렸다 내린 HeatMap 과 CustomControl 은 init 뒤에도 지도에 붙지 않는다',
    since: '0.4',
    mount: BEFORE_INIT,
    app: {
      mode: 'props',
      submodules: ['visualization'],
      delayStyleMs: INIT_DELAY_MS,
    },
    steps: [
      { t: 'frames', n: 1 },
      { t: 'props', props: { heatMapOpacity: 0.6, customControlPosition: 1 } },
      { t: 'frames', n: 2 },
      {
        t: 'props',
        props: { heatMapOpacity: undefined, customControlPosition: undefined },
      },
      { t: 'frames', n: 2 },
      { t: 'waitInit' },
      { t: 'frames', n: 10 },
    ],
    // heatMapOpacity 필드는 인스턴스가 있으면 붙었는지와 상관없이 값을 읽으므로, 붙었는가는
    // overlaysOnMap 으로 본다.
    expect: [overlaysOnMap([]), customControlAt(null), sameMap()],
  },
  {
    // 위 시나리오의 대조군. 내리지 않으면 init 뒤에 붙는다(init 지연 장치가 동작하는지도 가른다).
    name: 'init 전에 올린 HeatMap 과 CustomControl 은 init 뒤에 지도에 붙는다',
    since: '0.4',
    mount: BEFORE_INIT,
    app: {
      mode: 'props',
      submodules: ['visualization'],
      delayStyleMs: INIT_DELAY_MS,
    },
    steps: [
      { t: 'frames', n: 1 },
      { t: 'props', props: { heatMapOpacity: 0.6, customControlPosition: 1 } },
      { t: 'frames', n: 2 },
      { t: 'waitInit' },
      { t: 'frames', n: 10 },
    ],
    expect: [overlaysOnMap(['heatMap']), customControlAt(1), sameMap()],
  },

  // anchor Marker 를 새로 만들면 InfoWindow 가 새 Marker 위로 옮겨 가고 그 사이 닫히지 않는다.
  {
    name: 'anchor 로 쓰는 Marker 를 key 로 다시 만들어도 InfoWindow 가 닫히지 않고 새 Marker 위로 옮겨 간다',
    since: '0.4',
    app: { mode: 'props', infoWindowOnMarker: true },
    steps: [
      { t: 'frames', n: 3 },
      { t: 'props', props: { markerKey: 1 } },
      { t: 'frames', n: 5 },
      { t: 'props', props: { markerKey: 2 } },
      { t: 'frames', n: 5 },
    ],
    expect: [
      infoWindowAlwaysOpen(),
      // 새 anchor 로 open 하면 SDK 가 close 와 open 을 함께 낸다(피할 수 없다). key 를 두 번 바꿨으니
      // 두 쌍까지다. 그보다 많으면 사이에 한 번 더 닫았다 연 것이다.
      calls({ markerInfoClose: 2, markerInfoOpen: 2 }),
      infoWindowAtAnchor(),
      sameMap(),
    ],
  },

  // transition 안에서 지도의 자식이 suspend 하면 Suspense 가 이미 보인 지도를 숨기면 안 된다.
  {
    name: 'transition 안에서 지도 안 자식이 suspend 해도 지도가 숨지 않는다',
    since: '0.4',
    app: { mode: 'props', marker: true },
    steps: [
      { t: 'frames', n: 3 },
      { t: 'props', props: { suspendKey: 1 }, transition: true },
      // 자식이 200ms(가상 시계) 동안 suspend 한다. 풀린 뒤까지 본다.
      { t: 'frames', n: 30 },
    ],
    expect: [mapVisible(), sameMap(), mapAttached()],
  },

  // 지도를 내리는 순간 SDK 가 하던 작업(morph 애니메이션, 놓은 뒤 관성)이 destroy 된 지도를 건드리면
  // 에러가 난다. 에러가 어디서 나는지는 추정(SDK 의 rAF)이라 에러의 유무만 본다.
  {
    name: 'morph 애니메이션 도중 지도를 내려도 에러가 없다',
    since: '0.4',
    app: { mode: 'props' },
    steps: [
      { t: 'frames', n: 3 },
      { t: 'call', method: 'morph', args: [B, 12] },
      { t: 'frames', n: 3 },
      { t: 'props', props: { showMap: false } },
      { t: 'frames', n: 40 },
    ],
    expect: [noErrors()],
  },
  {
    name: 'morph 애니메이션 도중 key 로 지도를 다시 만들어도 에러가 없다',
    unstable: {
      fields: ['controls'],
      reason:
        '다시 만든 지도의 기본 컨트롤은 SDK 가 비동기로 붙여 그 프레임에 있을지가 실행마다 다르다',
    },
    since: '0.4',
    app: { mode: 'props', mapKey: 1 },
    steps: [
      { t: 'frames', n: 3 },
      { t: 'call', method: 'morph', args: [B, 12] },
      { t: 'frames', n: 3 },
      { t: 'props', props: { mapKey: 2 } },
      { t: 'frames', n: 40 },
    ],
    expect: [noErrors(), mapAttached()],
  },
  {
    name: '드래그를 놓은 직후 관성이 도는 중에 지도를 내려도 에러가 없다',
    since: '0.4',
    app: { mode: 'props' },
    steps: [
      ...dragAndRelease,
      { t: 'props', props: { showMap: false } },
      { t: 'frames', n: 40 },
    ],
    expect: [noErrors()],
  },
  {
    name: '드래그를 놓은 직후 관성이 도는 중에 key 로 지도를 다시 만들어도 에러가 없다',
    unstable: {
      fields: ['controls'],
      reason:
        '다시 만든 지도의 기본 컨트롤은 SDK 가 비동기로 붙여 그 프레임에 있을지가 실행마다 다르다',
    },
    since: '0.4',
    app: { mode: 'props', mapKey: 1 },
    steps: [
      ...dragAndRelease,
      { t: 'props', props: { mapKey: 2 } },
      { t: 'frames', n: 40 },
    ],
    expect: [noErrors(), mapAttached()],
  },

  // 경계가 던진 에러를 잡아 대체 UI 를 보이고, 리셋하면 Marker 가 한 벌만 지도에 붙는다.
  // 허용하는 에러는 일부러 던진 것 하나뿐이다. React 가 경계에서 잡은 에러를 console.error 로 알리는지
  // window error 로 알리는지는 확인하지 못했다(추정: console.error). window error 로 오면 scenarios.spec 의
  // pageerror 검사가 먼저 실패한다.
  {
    name: '지도 안 에러 경계가 대체 UI 를 보였다 리셋하면 같은 지도에 Marker 가 한 벌만 붙는다',
    since: '0.4',
    app: { mode: 'props', errorBoundary: true },
    steps: [
      { t: 'frames', n: 3 },
      { t: 'props', props: { throwKey: 1 } },
      { t: 'frames', n: 5 },
      { t: 'props', props: { throwKey: undefined, boundaryKey: 1 } },
      { t: 'frames', n: 10 },
    ],
    expect: [
      sameMap(),
      // 프레임 3~7 은 던진 뒤. 경계가 대체 UI 를 보이고 Marker 는 내려가 있다.
      frameAt(7, 'boundaryFallback', (v) => v === true),
      frameAt(7, 'boundaryMarkers', (v) => v === 0),
      lastFrame('boundaryFallback', false),
      lastFrame('boundaryMarkers', 1),
      noErrors(/E2E_BOUNDARY_THROW/),
    ],
  },

  // transition 밖에서 지도의 자식이 suspend 하면 React 는 지도를 숨겼다 다시 보인다. 이때 layout effect 만
  // 다시 돈다. 열어 둔 InfoWindow 를 다시 여는 일이 passive effect 에 있으면 다시 보인 뒤 닫힌 채 남았다.
  {
    name: 'suspend 로 숨겼다 다시 보인 지도에서 열어 둔 InfoWindow 가 다시 열린다',
    since: '0.4',
    app: { mode: 'props', infoWindow: true },
    steps: [
      { t: 'frames', n: 3 },
      { t: 'props', props: { suspendKey: 1 } },
      { t: 'frames', n: 35 },
    ],
    expect: [
      overlaysOnMap(['infoWindow'], 0),
      lastFrame('mapVisible', true),
      overlaysOnMap(['infoWindow']),
    ],
  },
  // init 전에 붙이기를 미룬 DrawingManager 가 init 때 붙으며 drawingMode 를 맞춘다. 그 사이 바뀐 prop 이
  // 아니라 처음 렌더의 값으로 맞추면 init 뒤 옛 모드로 돌아간다.
  {
    name: 'init 전에 바꾼 DrawingManager 의 drawingMode 가 init 뒤에도 남는다',
    since: '0.4',
    mount: BEFORE_INIT,
    app: {
      mode: 'props',
      submodules: ['drawing'],
      delayStyleMs: INIT_DELAY_MS,
      drawingMode: 5,
    },
    steps: [
      { t: 'frames', n: 1 },
      { t: 'props', props: { drawingMode: 6 } },
      { t: 'frames', n: 2 },
      { t: 'waitInit' },
      { t: 'frames', n: 10 },
    ],
    expect: [lastFrame('drawingMode', 6)],
  },
];
