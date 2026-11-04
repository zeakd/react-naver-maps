import {
  calls,
  followsProps,
  kvoFollowsMap,
  noBacktrack,
  settlesAt,
  settlesAtZoom,
  zoomReportsMatchMap,
} from '../assertions.js';
import type { Scenario, Step } from '../types.js';
import { A, B, HOME } from './steps.js';

/**
 * center 와 실수 zoom 을 매 프레임 조금씩 바꾸는 단계 30개. 프레임마다 경도 0.0002(zoom 15.3 에서 5.7px),
 * zoom 0.02 씩 간다. 한 프레임이라도 뒤처지면 5px 넘게 벌어지게 잡은 값이다.
 */
const everyFrame: Step[] = Array.from({ length: 30 }, (_, i): Step[] => [
  {
    t: 'props',
    props: {
      center: [HOME[0] + 0.00005 * (i + 1), HOME[1] + 0.0002 * (i + 1)],
      zoom: 15 + 0.02 * (i + 1),
    },
  },
  { t: 'frames', n: 1 },
]).flat();

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
  // 사례 14. 매 프레임 바뀌는 prop 마다 morph 를 새로 시작하면 지도가 뒤처지거나 떨린다(추정).
  // 실수 zoom 을 래스터 지도가 받아 주는지는 확인하지 못했다. 안 받으면 zoom 판정이 먼저 실패한다.
  {
    name: 'center 와 zoom 을 매 프레임 함께 바꾸면 지도가 매 프레임 그 prop 을 따른다',
    since: '0.4',
    app: { mode: 'props' },
    steps: [{ t: 'frames', n: 2 }, ...everyFrame],
    expect: [followsProps()],
  },
];
