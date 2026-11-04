import {
  calls,
  circleClicked,
  fired,
  markerAt,
  markerMovedFrom,
  markerClicked,
  lastFrame,
} from '../assertions.js';
import type { Scenario, Step } from '../types.js';
import { HOME, rerender } from './steps.js';

/** Marker, 도형, InfoWindow: 같은 값 재렌더, 클릭, 드래그, animation. */
export const overlays: Scenario[] = [
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
];
