import { defineFixture } from '../fixture.js';
import { INITIAL_CENTER } from '../common.js';
import { Marker } from '../target-imports.js';

export type MarkerCrowdConfig = {
  /** 인라인 onClick 핸들러가 있는 Marker 를 이 수만큼 지도 중앙 둘레에 격자로 올린다. */
  markerCount?: number;
  /** onClick 을 어떻게 줄지. 기본 inline(렌더마다 새 함수). stable 은 모듈의 같은 함수, none 은 주지 않는다. */
  markerCrowdHandler?: 'inline' | 'stable' | 'none';
};

const stableClick = () => {};

export type MarkerCrowdFrame = {
  /**
   * 이 프레임까지 naver.maps.Event.addListener 가 불린 수(누적). 앱을 올릴 때부터 센다.
   * 라이브러리가 부른 것과 SDK 안에서 같은 함수를 거쳐 부른 것이 섞인다(추정). 구간의 증가량으로 읽는다.
   * 버전마다 달라질 수 있는 값이라 비교 실행에서 뺀다(compare-expected 의 NEW_API_FIELDS).
   */
  addListenerCalls: number;
};

type Probe = { addListenerCalls: number };

const COLUMNS = 20;
const STEP_DEG = 0.0004;

/** i 번째 Marker 의 자리. 가운데에서 격자로 퍼진다. */
function positionOf(i: number) {
  const col = (i % COLUMNS) - COLUMNS / 2;
  const row = Math.floor(i / COLUMNS) - 7;
  return {
    lat: INITIAL_CENTER[0] + row * STEP_DEG,
    lng: INITIAL_CENTER[1] + col * STEP_DEG,
  };
}

export const markerCrowd = defineFixture<
  MarkerCrowdConfig,
  Probe,
  MarkerCrowdFrame
>({
  probe: () => ({ addListenerCalls: 0 }),
  setup: (maps, probe) => {
    const original = maps.Event.addListener;
    maps.Event.addListener = function (this: unknown, ...args: never[]) {
      probe.addListenerCalls += 1;
      return (original as (...a: unknown[]) => unknown).apply(this, args);
    } as typeof original;
  },
  render: (config) =>
    config.markerCount !== undefined &&
    Array.from({ length: config.markerCount }, (_, i) => (
      // 같은 순서로만 늘어나는 고정 격자라 인덱스 키가 안전하다.
      // oxlint-disable-next-line react/no-array-index-key
      <Marker
        key={i}
        position={positionOf(i)}
        onClick={
          config.markerCrowdHandler === 'none'
            ? undefined
            : config.markerCrowdHandler === 'stable'
              ? stableClick
              : () => {}
        }
      />
    )),
  read: (_map, probe) => ({ addListenerCalls: probe.addListenerCalls }),
});
