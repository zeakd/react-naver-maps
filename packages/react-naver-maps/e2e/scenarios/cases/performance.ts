import { addListenerCallsWithin, calls, callsIn } from '../assertions.js';
import { DATA_CROWD_FEATURES } from '../app/fixtures/data-layer.js';
import type { AppConfig, Scenario, Step } from '../types.js';
import { dragLeftAndRelease } from './steps.js';

/**
 * 성능: 사용자가 최적화하지 않은 단순한 코드(인라인 핸들러, 인라인 배열, 상태가 바뀌면 지도 전체가 다시
 * 렌더)에서 React 렌더와 SDK 사이의 비용을 라이브러리가 흡수하는가.
 *
 * 구조적인 보장(같은 값을 다시 쓰지 않는다, 리스너를 다시 붙이지 않는다)은 단언한다. 실제 JS 실행 시간
 * (scriptMs, CDP ScriptDuration)은 기기마다 달라 단언하지 않고 기록한다. 조건끼리의 비교는 같은 실행의
 * trace 로 한다(끄는 동안 = 프레임 0~16 의 scriptMs 증가량).
 */
/** 끄는 동안(놓기 전까지)만 CPU 프로파일을 잰다(profile-1.txt 첨부). */
const profiledDrag: Step[] = [
  { t: 'profile', kind: 'start' },
  ...dragLeftAndRelease.slice(0, -1),
  { t: 'profile', kind: 'stop' },
  dragLeftAndRelease.at(-1)!,
];

const drag = (name: string, app: Partial<AppConfig>, extra = {}): Scenario => ({
  name,
  since: '0.4',
  app: { mode: 'controlled', measureScript: true, ...app },
  steps: profiledDrag,
  expect: [calls({ setPosition: 0, setPath: 0, ...extra })],
});

export const performance: Scenario[] = [
  {
    // 데이터 레이어는 지도마다 하나다. 한 GeoJson 의 style 이 바뀌면 그 feature 만 다시 칠한다.
    // 시간은 CPU 프로파일로 남긴다(profile-1: 50개 마운트, profile-2: 하나의 style 변경). props 단계는
    // page.evaluate 로 들어와 scriptMs(CDP ScriptDuration)에 잡히지 않는다.
    name: '성능: GeoJson 50개(각 사각형 20개)를 올리고 하나의 style 을 바꾼다',
    since: '0.4',
    app: { mode: 'props', dataCrowd: 0 },
    steps: [
      { t: 'frames', n: 2 },
      { t: 'profile', kind: 'start' },
      { t: 'props', props: { dataCrowd: 50 } },
      { t: 'frames', n: 3 },
      { t: 'profile', kind: 'stop' },
      { t: 'profile', kind: 'start' },
      { t: 'props', props: { dataCrowdFirstFill: '#0000ff' } },
      { t: 'frames', n: 3 },
      { t: 'profile', kind: 'stop' },
    ],
    expect: [callsIn(5, 8, { crowdFirst: DATA_CROWD_FEATURES, crowdOther: 0 })],
  },
  drag('성능: 오버레이 없이 controlled center 로 끈다', {}),
  {
    ...drag(
      '성능: 인라인 onClick 이 있는 Marker 300개와 controlled center 로 끈다',
      {
        markerCount: 300,
      },
    ),
    expect: [calls({ setPosition: 0 }), addListenerCallsWithin(0, 16, 0)],
  },
  drag(
    '성능: 같은 onClick 함수를 쓰는 Marker 300개와 controlled center 로 끈다',
    {
      markerCount: 300,
      markerCrowdHandler: 'stable',
    },
  ),
  drag('성능: onClick 이 없는 Marker 300개와 controlled center 로 끈다', {
    markerCount: 300,
    markerCrowdHandler: 'none',
  }),
  drag(
    '성능: 꼭짓점 1만 개 Polyline 을 같은 배열로 두고 controlled center 로 끈다',
    {
      heavyPolylinePoints: 10000,
    },
  ),
  drag(
    '성능: 꼭짓점 1만 개 Polyline 을 렌더마다 새 배열로 주고 controlled center 로 끈다',
    { heavyPolylinePoints: 10000, heavyPolylineInline: true },
  ),
];
