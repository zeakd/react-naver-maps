import {
  dataLayer,
  groundOverlaysCreated,
  overlaysOnMap,
  frameAt,
} from '../assertions.js';
import type { Scenario } from '../types.js';
import { rerender } from './steps.js';

/** 레이어와 데이터: Layer, LabelLayer, BicycleLayer, GroundOverlay, GeoJson, Kml, Gpx. */
export const layersData: Scenario[] = [
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
];
