import {
  calls,
  callsIn,
  markerAt,
  markerMovedFrom,
  movedBy,
  oneWay,
  staysAfter,
} from '../assertions.js';
import type { Scenario, Step } from '../types.js';
import { HOME, dragLeftAndRelease, rerender } from './steps.js';

/** 앱 상태가 지도와 어긋나는 경우와 같은 값 재렌더. */
export const stateDrift: Scenario[] = [
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
];
