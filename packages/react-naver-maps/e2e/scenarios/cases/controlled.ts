import {
  calls,
  controlCount,
  fired,
  settlesAt,
  settlesAtZoom,
  zoomReportsMatchMap,
} from '../assertions.js';
import type { Scenario } from '../types.js';
import { B, drag } from './steps.js';

/** controlled 드래그, StrictMode, zoom 보고. */
export const controlled: Scenario[] = [
  {
    name: 'controlled 드래그는 지도 메서드를 다시 부르지 않는다',
    app: { mode: 'controlled' },
    steps: [
      ...drag(300, -10, 15),
      { t: 'mouse', kind: 'up', x: 150, y: 200 },
      { t: 'frames', n: 40 },
    ],
    expect: [
      fired('dragstart', 1),
      fired('dragend', 1),
      calls({ panTo: 0, setCenter: 0, morph: 0 }),
    ],
  },
  {
    name: '드래그 중 들어온 center prop 은 드래그가 끝나면 지도에 반영된다',
    app: { mode: 'controlled' },
    steps: [
      ...drag(300, -10, 8),
      { t: 'props', props: { center: B } },
      ...drag(220, -10, 0).slice(2),
      { t: 'frames', n: 5 },
      { t: 'mouse', kind: 'up', x: 220, y: 200 },
      { t: 'frames', n: 40 },
    ],
    expect: [settlesAt(B)],
  },
  {
    // SDK 기본 컨트롤 3개 + 줌 컨트롤. StrictMode 밖에서도 4개다.
    name: 'StrictMode 에서 컨트롤이 두 벌 생기지 않는다',
    app: { mode: 'props', strict: true, zoomControl: true },
    steps: [{ t: 'frames', n: 10 }],
    expect: [controlCount(4)],
  },
  {
    name: 'gl 없으면 onZoomChanged 값은 getZoom() 과 같다',
    app: { mode: 'props' },
    steps: [
      { t: 'props', props: { zoom: 13 } },
      { t: 'frames', n: 60 },
    ],
    expect: [settlesAtZoom(13), zoomReportsMatchMap()],
  },
  {
    name: 'gl 서브모듈을 불러도 onZoomChanged 값은 getZoom() 과 같다',
    app: { mode: 'props', submodules: ['gl'] },
    steps: [
      { t: 'props', props: { zoom: 13 } },
      { t: 'frames', n: 60 },
    ],
    expect: [settlesAtZoom(13), zoomReportsMatchMap()],
  },
];
