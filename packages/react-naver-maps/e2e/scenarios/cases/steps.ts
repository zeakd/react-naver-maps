import type { LL, Step } from '../types.js';

export const A: LL = [37.57, 126.99];
export const B: LL = [37.56, 126.96];
/** app 의 INITIAL_CENTER(app/common.ts). Marker 도 여기 있다. */
export const HOME: LL = [37.5666, 126.9784];

/**
 * 지도를 왼쪽으로 끌고 놓은 뒤 관성이 끝날 때까지. 프레임 수는 1 + 15 + 60.
 * 한 번에 7px 씩 민다. 10px 이면 zoom 15 에서 경도가 소수 넷째 자리에 딱 맞아 반올림해도
 * 값이 같아진다(GL 에서 관찰).
 */
export const dragLeftAndRelease: Step[] = [
  ...drag(300, -7, 15),
  { t: 'mouse', kind: 'up', x: 195, y: 200 },
  { t: 'frames', n: 60 },
];

/**
 * 한 손가락으로 왼쪽으로 끌고 뗀 뒤 60프레임. 프레임 수는 1 + 15 + 60.
 * 처음 두 번의 touchmove 는 touch slop 안이라 페이지에 가지 않아 dragstart 는 프레임 3 에 온다.
 */
export const touchDragLeftAndRelease: Step[] = [
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
export const pinchOut: Step[] = [
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

export const rerender = (n: number): Step[] =>
  Array.from({ length: n }, (_, i): Step => ({
    t: 'props',
    props: { tick: i + 1 },
  }));

export function drag(fromX: number, dx: number, moves: number): Step[] {
  return [
    { t: 'mouse', kind: 'down', x: fromX, y: 200 },
    { t: 'frames', n: 1 },
    ...Array.from({ length: moves }, (_, i): Step[] => [
      { t: 'mouse', kind: 'move', x: fromX + dx * (i + 1), y: 200 },
      { t: 'frames', n: 1 },
    ]).flat(),
  ];
}
