import {
  calls,
  circleClicked,
  fired,
  mapWidth,
  markerClicked,
} from '../assertions.js';
import type { Scenario, Step } from '../types.js';

/** 값이 그대로면 setter 를 부르지 않는 것, 클릭 가능 여부, 자동 크기. */
export const stability: Scenario[] = [
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
];
