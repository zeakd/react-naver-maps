import { lastFrame, mapVisible, noErrors, sameMap } from '../assertions.js';
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

  // SDK 상수를 이름으로 준다(sdk/constants.ts). 렌더마다 새 객체여도 이름을 값으로 바꾼 뒤 값으로
  // 비교하므로 setOptions 를 다시 부르지 않는다.
  {
    name: '컨트롤 옵션을 상수 이름으로 주면 그 자리와 모양이 되고 다시 렌더해도 setOptions 를 부르지 않는다',
    since: '0.4',
    app: {
      mode: 'props',
      zoomControl: true,
      zoomControlOptionsNamed: { position: 'TOP_RIGHT', style: 'SMALL' },
      countMapSetOptions: true,
    },
    steps: [{ t: 'frames', n: 2 }, ...rerender(10), { t: 'frames', n: 3 }],
    expect: [
      lastFrame('zoomControlPositionName', 'TOP_RIGHT'),
      lastFrame('zoomControlStyleName', 'SMALL'),
      (trace) => {
        const first = trace[0]!.mapSetOptionsCalls ?? 0;
        const last = trace.at(-1)!.mapSetOptionsCalls ?? 0;
        return last === first
          ? null
          : `다시 렌더하는 동안 setOptions ${last - first}회`;
      },
    ],
  },
  // mapTypes 와 mapTypeId 는 서로 기댄다. 새 레지스트리에만 있는 ID 를 옛 레지스트리에 먼저 넣으면 SDK 가
  // 던져 지도 트리가 내려갔다(2026-11-05 리뷰).
  {
    name: '옛 레지스트리에 없는 mapTypeId 를 새 mapTypes 와 함께 주면 그 유형으로 바뀐다',
    since: '0.4',
    app: { mode: 'props' },
    steps: [
      { t: 'frames', n: 2 },
      { t: 'props', props: { customMapTypes: true } },
      { t: 'frames', n: 5 },
    ],
    expect: [noErrors(), lastFrame('mapTypeId', 'custom'), mapVisible()],
  },
];
