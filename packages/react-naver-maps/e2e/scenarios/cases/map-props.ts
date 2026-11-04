import { sameMap, lastFrame } from '../assertions.js';
import type { Scenario } from '../types.js';
import { A, rerender } from './steps.js';

/** NaverMap 에 넘기는 prop: cursor, mapTypes. */
export const mapProps: Scenario[] = [
  {
    name: 'cursor 를 주고 올리면 지도 위 커서가 그 값이다',
    app: { mode: 'props', mapCursor: 'crosshair' },
    steps: [{ t: 'frames', n: 2 }],
    expect: [lastFrame('mapCursor', 'crosshair')],
  },
  {
    // KVO 객체는 참조로 비교한다. 예전에는 키마다 훑다가 순환 참조로 스택이 넘쳤다.
    // 렌더마다 새로 만들면 새 값이라 매번 넣는다(앱은 useMemo 로 한 번 만든다).
    name: '렌더마다 새 MapTypeRegistry 를 넘겨도 에러 없이 같은 지도로 남는다',
    app: { mode: 'props', mapTypesInline: true },
    steps: [...rerender(3), { t: 'frames', n: 3 }],
    expect: [sameMap()],
  },
  {
    // SDK 는 리터럴 좌표를 지금 지도 유형의 투영으로 바꾸는데, 투영을 생략한 유형이면 던졌다.
    name: '투영을 생략한 사용자 지도 유형에서도 리터럴 center 로 올리고 옮긴다',
    since: '0.4',
    app: { mode: 'props', projectionlessMapType: true },
    steps: [
      { t: 'frames', n: 2 },
      { t: 'props', props: { center: A } },
      { t: 'frames', n: 5 },
    ],
    expect: [sameMap()],
  },
];
