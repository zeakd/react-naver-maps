import {
  addListenerCallsWithin,
  calls,
  circleClicked,
  fired,
  markerAt,
  markerMovedFrom,
  markerClicked,
  lastFrame,
} from '../assertions.js';
import type { Scenario, Step } from '../types.js';
import { dragLeftAndRelease, HOME, rerender } from './steps.js';

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
    name: '닫힌 InfoWindow 에 첫 position 과 open 을 한 렌더에 주면 열린다',
    app: { mode: 'props', infoWindowLate: true },
    steps: [
      { t: 'frames', n: 2 },
      { t: 'props', props: { infoWindowLateOpen: true } },
      { t: 'frames', n: 5 },
    ],
    expect: [calls({ infoWindowLateOpen: 1 })],
  },
  {
    name: '마운트 중에 부모가 바꾼 prop 이 SDK 에 들어간다',
    app: { mode: 'props', markerTitleDuringMount: true },
    steps: [
      { t: 'props', props: { tick: 1 } },
      { t: 'frames', n: 3 },
    ],
    expect: [calls({ 'title:red': 0, 'title:blue': 1 })],
  },
  {
    name: 'CustomOverlay 의 position 을 바꾸면 같은 렌더의 부모 layout effect 에서 새 자리에 그려져 있다',
    since: '0.4',
    app: { mode: 'props', customOverlayProbe: true },
    steps: [
      { t: 'frames', n: 3 },
      { t: 'props', props: { customOverlayShift: 1 } },
      { t: 'frames', n: 3 },
    ],
    expect: [calls({ 'layout:1:match': 1, 'layout:1:stale': 0 })],
  },
  {
    name: 'StrictMode 에서도 CustomOverlay 의 position 을 바꾸면 부모 layout effect 에서 새 자리에 그려져 있다',
    since: '0.4',
    app: { mode: 'props', strict: true, customOverlayProbe: true },
    steps: [
      { t: 'frames', n: 3 },
      { t: 'props', props: { customOverlayShift: 1 } },
      { t: 'frames', n: 3 },
    ],
    expect: [calls({ 'layout:1:match': 1, 'layout:1:stale': 0 })],
  },
  {
    name: '마운트 중에 부모가 바꾼 CustomOverlay 의 position 이 그려진다',
    since: '0.4',
    app: {
      mode: 'props',
      customOverlayProbe: true,
      customOverlayShiftDuringMount: true,
    },
    steps: [
      { t: 'props', props: { tick: 1 } },
      { t: 'frames', n: 3 },
    ],
    expect: [calls({ 'paint:1:match': 1, 'paint:1:stale': 0 })],
  },
  {
    name: '숨긴 동안 바꾼 CustomOverlay 의 position 이 다시 보일 때 그려진다',
    since: '0.4',
    app: { mode: 'props', customOverlayProbe: true },
    steps: [
      { t: 'frames', n: 3 },
      { t: 'props', props: { customOverlayActivity: 'hidden' } },
      { t: 'frames', n: 2 },
      { t: 'props', props: { customOverlayShift: 1 } },
      { t: 'frames', n: 2 },
      { t: 'props', props: { customOverlayActivity: 'visible' } },
      { t: 'frames', n: 3 },
    ],
    expect: [
      calls({
        'layout:1:match': 1,
        'layout:1:stale': 0,
        'paint:1:match': 1,
        'paint:1:stale': 0,
      }),
    ],
  },
  {
    name: '숨겼다 다시 보인 CustomOverlay 는 바깥에서 바꾼 컨테이너 zIndex 를 prop 으로 되돌린다',
    since: '0.4',
    app: { mode: 'props', customOverlayProbe: true },
    steps: [
      { t: 'frames', n: 3 },
      { t: 'props', props: { customOverlayExternalZ: true } },
      { t: 'frames', n: 2 },
      { t: 'props', props: { customOverlayActivity: 'hidden' } },
      { t: 'frames', n: 2 },
      { t: 'props', props: { customOverlayActivity: 'visible' } },
      { t: 'frames', n: 3 },
    ],
    expect: [calls({ 'z:99': 1, 'z:5': 1 })],
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
    name: 'StrictMode 에서도 clickable 을 나중에 켠 Marker 가 클릭을 받는다',
    app: { mode: 'props', strict: true, marker: true, markerClickable: false },
    steps: [
      { t: 'props', props: { markerClickable: true } },
      { t: 'frames', n: 5 },
      { t: 'clickCenter' },
      { t: 'frames', n: 5 },
    ],
    expect: [markerClicked(1)],
  },
  {
    // SDK 는 지도에 붙일 때 clickable 인 Marker 에만 DOM 리스너를 단다. 다시 붙일 때도 그래야 한다.
    name: 'Activity 로 숨겼다 보인 Marker 도 clickable 을 켜면 클릭을 받는다',
    app: { mode: 'props', marker: true, markerClickable: false },
    steps: [
      { t: 'frames', n: 2 },
      { t: 'props', props: { markerActivity: 'hidden' } },
      { t: 'frames', n: 5 },
      { t: 'props', props: { markerActivity: 'visible' } },
      { t: 'frames', n: 5 },
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

  // SDK 는 지도마다 InfoWindow 하나만 연다. 둘 다 open 이면 렌더마다 서로 닫고 열 수 있다.
  {
    name: '두 InfoWindow 를 열어 두고 다시 렌더해도 서로 닫고 열기를 반복하지 않는다',
    app: { mode: 'props', infoWindow: true, infoWindow2: true },
    steps: [{ t: 'frames', n: 5 }, ...rerender(10), { t: 'frames', n: 5 }],
    expect: [
      (trace) => {
        const later = trace.slice(5).flatMap((f) => f.calls);
        const flips = later.filter((c) => c.startsWith('infoWindow')).length;
        return flips === 0
          ? null
          : `처음 뒤로 열고 닫기 ${flips}회 (${later.join(', ')})`;
      },
    ],
  },
  // Marker 300개의 인라인 onClick 은 렌더마다 새 함수다. 끄는 동안(프레임 0~15) controlled center 가 매 프레임
  // 렌더를 일으킨다. 리스너는 핸들러가 생기거나 없어질 때만 붙여야 한다(binding/use-latest.ts). 예전에는 프레임마다
  // 리스너 306개를 다시 붙였다(2026-11-05 실측).
  {
    name: 'Marker 300개와 controlled center 로 끌어도 Marker 의 위치를 다시 쓰지 않고 리스너를 다시 붙이지 않는다',
    since: '0.4',
    app: { mode: 'controlled', marker: false, markerCount: 300 },
    steps: dragLeftAndRelease,
    expect: [calls({ setPosition: 0 }), addListenerCallsWithin(0, 16, 0)],
  },

  {
    name: 'Marker 의 animation 을 상수 이름으로 주면 그 애니메이션이 된다',
    since: '0.4',
    app: { mode: 'props', marker: true, markerAnimation: 'BOUNCE' },
    steps: [{ t: 'frames', n: 2 }, ...rerender(5), { t: 'frames', n: 3 }],
    // BOUNCE 는 SDK 3.10.5 에서 1(sdk 스냅샷 확인). 다시 렌더해도 다시 넣지 않는다(changeOnly).
    expect: [lastFrame('markerAnimation', 1), calls({ setAnimation: 0 })],
  },
];
