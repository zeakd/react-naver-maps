import {
  calls,
  followsProps,
  kvoFollowsMap,
  noBacktrack,
  settlesAt,
  settlesAtZoom,
  zoomReportsMatchMap,
} from '../assertions.js';
import type { Scenario } from '../types.js';
import { A, B, HOME, everyFrame } from './steps.js';

/**
 * center 와 실수 zoom 을 매 프레임 조금씩 바꾸는 단계 30개. 프레임마다 경도 0.0002(zoom 15.3 에서 5.7px),
 * zoom 0.02 씩 간다. 한 프레임이라도 뒤처지면 5px 넘게 벌어지게 잡은 값이다.
 */
/** 카메라: center·zoom prop 과 지도 메서드 호출, KVO, onZoomChanged 보고. */
export const camera: Scenario[] = [
  {
    name: 'center prop 변경은 setCenter 를 쓰지 않는다',
    app: { mode: 'props' },
    steps: [
      { t: 'props', props: { center: A } },
      { t: 'frames', n: 30 },
    ],
    expect: [settlesAt(A), calls({ panTo: 1, setCenter: 0 })],
  },
  {
    name: 'center 와 zoom 을 함께 바꾸면 morph 한 번으로 처리한다',
    app: { mode: 'props' },
    steps: [
      { t: 'props', props: { center: A, zoom: 12 } },
      { t: 'frames', n: 90 },
    ],
    expect: [
      settlesAt(A),
      settlesAtZoom(12),
      calls({ morph: 1, setZoom: 0, panTo: 0 }),
    ],
  },
  {
    name: 'panTo 도중 목표를 바꿔도 새 목표로 곧장 간다',
    app: { mode: 'props' },
    steps: [
      { t: 'call', method: 'panTo', args: [A] },
      { t: 'frames', n: 10 },
      { t: 'call', method: 'panTo', args: [B] },
      { t: 'frames', n: 110 },
    ],
    expect: [settlesAt(B), noBacktrack(B, 11)],
  },
  {
    name: 'panTo 도중 center prop 이 바뀌면 prop 값으로 끝난다',
    app: { mode: 'props' },
    steps: [
      { t: 'call', method: 'panTo', args: [A] },
      { t: 'frames', n: 10 },
      { t: 'props', props: { center: B } },
      { t: 'frames', n: 110 },
    ],
    expect: [settlesAt(B), noBacktrack(B, 11)],
  },
  {
    name: '한 프레임 안에 center prop 이 되돌아오면 처음 값에 머문다',
    app: { mode: 'props', center: A },
    steps: [
      { t: 'props', props: { center: B } },
      { t: 'props', props: { center: A } },
      { t: 'frames', n: 60 },
    ],
    expect: [settlesAt(A)],
  },
  {
    name: 'useKVO 는 지도 이동과 줌을 따라간다',
    app: { mode: 'props' },
    steps: [
      { t: 'props', props: { center: A, zoom: 13 } },
      { t: 'frames', n: 90 },
    ],
    expect: [settlesAt(A), kvoFollowsMap()],
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

  // QC #3: 1px 허용을 지금 zoom 으로 재면 zoom 7 의 1px 안이 zoom 18 에서는 수천 px 이다.
  {
    name: '가까운 center 와 큰 zoom 을 함께 바꾸면 그 center 가 가운데에 온다',
    app: { mode: 'props', zoom: 7 },
    steps: [
      { t: 'props', props: { center: [37.5706, 126.9784], zoom: 18 } },
      { t: 'frames', n: 90 },
    ],
    expect: [settlesAt([37.5706, 126.9784]), settlesAtZoom(18)],
  },
  // 사례 14. 매 프레임 바뀌는 prop 을 매 프레임 따라야 한다. 래스터 지도는 실수 zoom 을 반올림해 쓰므로
  // zoom 정수가 그대로인 동안(15.02 ~ 15.48, 프레임 2~25)은 center 만 바뀐 것이라 바로 옮긴다. 예전에는
  // 실수 zoom 이 바뀔 때마다 morph 를 불렀고 SDK 는 같은 정수 zoom 의 morph 를 center 째 무시해 지도가
  // 처음 자리에서 움직이지 않았다. 정수가 바뀌는 순간(15.5)의 morph 는 SDK 애니메이션이라 끝날 때까지
  // 보고되는 center 가 늦다(SDK 는 morph 가 끝나야 KVO 를 낸다). 끝에서는 마지막 prop 에 닿는다.
  {
    name: 'center 와 zoom 을 매 프레임 함께 바꾸면 지도가 매 프레임 그 prop 을 따른다',
    since: '0.4',
    app: { mode: 'props' },
    steps: [{ t: 'frames', n: 2 }, ...everyFrame, { t: 'frames', n: 90 }],
    expect: [
      (trace) => followsProps(2)(trace.slice(0, 26)),
      settlesAt([HOME[0] + 0.00005 * 30, HOME[1] + 0.0002 * 30]),
      settlesAtZoom(16),
    ],
  },
];
