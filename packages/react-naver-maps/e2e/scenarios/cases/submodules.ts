import {
  calls,
  drawn,
  heatMapOpacity,
  probedAt,
  probedAtLeast,
  overlaysOnMap,
  polygonFirstMovesLeft,
  sameMap,
} from '../assertions.js';
import type { Scenario, Step } from '../types.js';
import { drag, HOME, rerender } from './steps.js';

/** 서브모듈이 필요한 컴포넌트: visualization, drawing, panorama. */
export const submodules: Scenario[] = [
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
    // StrictMode 는 마운트 직후 effect 를 정리했다 다시 돌린다. 그 사이 SDK 가 되돌린 drawingMode 를
    // 다시 렌더 없이도 맞춰야 한다.
    name: 'StrictMode 에서도 DrawingManager 가 마커 모드로 그린다',
    since: '0.4',
    app: {
      mode: 'props',
      strict: true,
      submodules: ['drawing'],
      drawingMode: 6,
    },
    steps: [{ t: 'frames', n: 5 }, { t: 'clickCenter' }, { t: 'frames', n: 5 }],
    expect: [drawn({ drawings: 1, added: 1 })],
  },
  {
    // SDK 는 DrawingManager 를 지도에서 떼면 drawingMode 를 0(HAND)으로 되돌린다(3.10.5 실측).
    name: 'Activity 로 숨겼다 보인 DrawingManager 도 마커 모드로 그린다',
    since: '0.4',
    app: { mode: 'props', submodules: ['drawing'], drawingMode: 6 },
    steps: [
      { t: 'frames', n: 2 },
      { t: 'props', props: { drawingActivity: 'hidden' } },
      { t: 'frames', n: 5 },
      { t: 'props', props: { drawingActivity: 'visible' } },
      { t: 'frames', n: 5 },
      { t: 'clickCenter' },
      { t: 'frames', n: 5 },
    ],
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
    name: 'editable Polygon 의 꼭짓점을 끌면 옮겨지고 다시 렌더해도 그대로다',
    since: '0.4',
    app: { mode: 'props', submodules: ['drawing'], editablePolygon: true },
    steps: [
      { t: 'frames', n: 2 },
      ...drag(300, -6, 5),
      { t: 'mouse', kind: 'up', x: 270, y: 200 },
      { t: 'frames', n: 5 },
      ...rerender(2),
      { t: 'frames', n: 2 },
    ],
    expect: [
      (trace) => {
        const first = trace[0]!.polygonFirst!;
        const last = trace.at(-1)!.polygonFirst!;
        return last[1] < first[1] - 0.0001
          ? null
          : `꼭짓점이 옮겨지지 않았다: ${JSON.stringify(first)} -> ${JSON.stringify(last)}`;
      },
      sameMap(),
    ],
  },
  // QC 사례 23. 문서상 지원하지 않는 조합이다(src/core/hooks/use-editable.ts 의 주석): editable 도형의 편집은
  // SDK 의 path 배열을 제자리에서 고치고 이벤트를 내지 않아, controlled paths 를 렌더마다 다시 주면
  // 편집이 되돌려질 수 있다. 되돌려지지 않는 것이 목표인지, 문서대로 defaultPath 만 지원하는지는 운전 세션이
  // 정한다. 꼭짓점의 화면 자리는 앱의 pointOf(HOME 이 첫 꼭짓점)로 얻는다. 투영의 좌표 기준은 확인하지 못했다.
  {
    name: 'controlled paths 를 준 editable Polygon 의 꼭짓점을 끄는 동안 다시 렌더해도 편집이 끊기지 않는다',
    since: '0.4',
    app: {
      mode: 'props',
      submodules: ['drawing'],
      editablePolygon: true,
      polygonPathsMode: 'controlled',
    },
    steps: [
      { t: 'frames', n: 2 },
      { t: 'mouseAt', kind: 'down', ll: HOME },
      { t: 'frames', n: 1 },
      ...Array.from({ length: 6 }, (_, i): Step[] => [
        { t: 'mouseAt', kind: 'move', ll: HOME, dx: -6 * (i + 1) },
        { t: 'props', props: { tick: i + 1 } },
        { t: 'frames', n: 1 },
      ]).flat(),
      { t: 'mouseAt', kind: 'up', ll: HOME, dx: -36 },
      { t: 'frames', n: 3 },
    ],
    expect: [calls({ setPaths: 0 }), polygonFirstMovesLeft(0.0001), sameMap()],
  },
];
