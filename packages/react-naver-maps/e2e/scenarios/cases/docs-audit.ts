import {
  calls,
  dataLayer,
  probedAtLeast,
  overlaysOnMap,
  sameMap,
  lastFrame,
  frameAt,
} from '../assertions.js';
import type { Scenario } from '../types.js';
import { A, drag, rerender } from './steps.js';

/** 공식 문서 전수 대조에서 나온 동작과 이후 추가분. */
export const docsAudit: Scenario[] = [
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
];
