import {
  customControlAt,
  customControlText,
  drawn,
  dataLayer,
  groundOverlaysCreated,
  heatMapOpacity,
  probedAt,
  probedAtLeast,
  overlaysOnMap,
} from '../assertions.js';
import type { Scenario } from '../types.js';
import { rerender } from './steps.js';

/** 오버레이·레이어·시각화 컴포넌트. */
export const overlays: Scenario[] = [
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
];
