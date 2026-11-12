import {
  controlCount,
  mapAttached,
  markerOnMap,
  mapWidth,
  overlaysOnMap,
  sameMap,
  settlesAt,
  settlesAtZoom,
} from '../assertions.js';
import type { Scenario } from '../types.js';
import { B, HOME } from './steps.js';

/** 수명: 지도와 인스턴스가 key, StrictMode, suspend, Activity 를 지나도 살아 있는지. */
export const lifecycle: Scenario[] = [
  {
    name: 'key 로 다시 만든 지도가 화면에 남는다',
    unstable: {
      fields: ['controls'],
      reason:
        '다시 만든 지도의 기본 컨트롤은 SDK 가 비동기로 붙여 첫 프레임에 있을지가 실행마다 다르다(같은 커밋끼리 4회 중 4회)',
    },
    app: { mode: 'props', mapKey: 1 },
    steps: [
      { t: 'props', props: { mapKey: 2 } },
      { t: 'frames', n: 30 },
    ],
    expect: [mapAttached()],
  },
  {
    // SDK 기본 컨트롤 3개 + 줌 컨트롤. StrictMode 밖에서도 4개다.
    name: 'StrictMode 에서 컨트롤이 두 벌 생기지 않는다',
    app: { mode: 'props', strict: true, zoomControl: true },
    steps: [{ t: 'frames', n: 10 }],
    expect: [controlCount(4)],
  },
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

  // 다시 보일 때 카메라 effect 가 크기를 다시 재기 전에 돈다.
  {
    name: 'Activity 로 숨긴 동안 바꾼 center·zoom·크기가 보일 때 한 번에 맞는다',
    since: '0.4',
    app: { mode: 'props' },
    steps: [
      { t: 'frames', n: 2 },
      { t: 'props', props: { mapActivity: 'hidden' } },
      { t: 'frames', n: 2 },
      { t: 'props', props: { center: B, zoom: 12, containerWidth: 400 } },
      { t: 'frames', n: 2 },
      { t: 'props', props: { mapActivity: 'visible' } },
      { t: 'frames', n: 60 },
    ],
    expect: [settlesAt(B), settlesAtZoom(12), mapWidth(400), sameMap()],
  },
  // 숨긴 채 제거한 Marker 는 다시 보여도 지도에 없다.
  {
    name: '숨긴 채 제거한 Marker 는 지도를 다시 보여도 붙지 않는다',
    since: '0.4',
    app: { mode: 'props', marker: true },
    steps: [
      { t: 'frames', n: 2 },
      { t: 'props', props: { markerActivity: 'hidden' } },
      { t: 'frames', n: 2 },
      { t: 'props', props: { marker: false } },
      { t: 'frames', n: 2 },
      { t: 'props', props: { mapActivity: 'hidden' } },
      { t: 'frames', n: 2 },
      { t: 'props', props: { mapActivity: 'visible' } },
      { t: 'frames', n: 5 },
    ],
    expect: [markerOnMap(false)],
  },
];
