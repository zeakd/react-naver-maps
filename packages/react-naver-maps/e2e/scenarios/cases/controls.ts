import { customControlAt, customControlText, mapWidth } from '../assertions.js';
import type { Scenario } from '../types.js';

/** 지도 컨트롤: useAutoResize, CustomControl. */
export const controls: Scenario[] = [
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
];
