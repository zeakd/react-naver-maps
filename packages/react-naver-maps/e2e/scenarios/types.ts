import type { FixtureConfig, FixtureFrame } from './app/fixtures/index.js';

/** 위도, 경도 */
export type LL = [number, number];

/**
 * 시나리오가 올리는 앱의 설정. app/ 이 이 값으로 라이브러리를 렌더링한다.
 * 지도 본체의 설정(CoreConfig)에 기능별 픽스처(app/fixtures)의 설정이 합쳐진다.
 */
export type AppConfig = CoreConfig & FixtureConfig;

/** 지도 본체의 설정: center 를 내려주는 방식, 지도 prop, 컨테이너. */
export type CoreConfig = {
  /**
   * center 를 내려주는 방식.
   * - props: 설정의 center 를 렌더마다 새 객체로 내려준다. 상태를 갱신하지 않는다.
   * - controlled: onCenterChanged 로 받은 값을 상태에 넣어 되돌려준다.
   * - rounded: controlled 와 같되 위도·경도를 소수 넷째 자리로 반올림해 넣는다.
   * - debounced: 마지막 onCenterChanged 300ms 뒤에 그 값을 상태에 넣는다.
   */
  mode: 'props' | 'controlled' | 'rounded' | 'debounced';
  center?: LL;
  zoom?: number;
  strict?: boolean;
  zoomControl?: boolean;
  submodules?: string[];
  /** rounded 의 소수 자릿수. 기본 4. */
  roundDigits?: number;
  /** NaverMap 의 gl. submodules 에 'gl' 이 있어야 한다. */
  gl?: boolean;
  /** 터치 입력을 켠다(드라이버가 브라우저 터치 지원을 흉내 낸다). */
  touch?: boolean;
  /** 기본값은 app/common.ts 의 NCP_KEY_ID */
  ncpKeyId?: string;
  /** NaverMap 의 key. 바꾸면 지도를 다시 만든다. */
  mapKey?: number;
  /** padding, zoomControlOptions 를 인라인 객체로 넘긴다. */
  inlineOptions?: boolean;
  /** Container 너비. 기본값은 600 */
  containerWidth?: number;
  /** 지도(Container 안)를 Activity 로 감싼다. */
  mapActivity?: 'visible' | 'hidden';
  /** NaverMap 의 cursor */
  mapCursor?: string;
  /** NaverMap 의 mapTypes 에 렌더마다 새로 만든 같은 내용의 MapTypeRegistry(normal 하나)를 넘긴다. */
  mapTypesInline?: boolean;
  /** 투영(projection)을 생략한 사용자 지도 유형 하나를 mapTypes 로 주고 그 유형으로 올린다(공식 예제 "지도 유형 기본"). */
  projectionlessMapType?: boolean;
  /** 값을 바꾸지 않고 재렌더만 일으킨다. */
  tick?: number;
};

export type Step =
  | { t: 'props'; props: Partial<AppConfig> }
  | { t: 'frames'; n: number }
  | { t: 'call'; method: string; args?: unknown[] }
  | { t: 'mouse'; kind: 'down' | 'move' | 'up'; x: number; y: number }
  | { t: 'wheel'; x: number; y: number; deltaY: number }
  /** 지도 중앙을 실제 DOM 클릭으로 누른다. */
  | { t: 'clickCenter' }
  /** 터치. points 는 화면 좌표이고 end 는 모든 손가락을 뗀다. AppConfig.touch 가 있어야 한다. */
  | { t: 'touch'; kind: 'start' | 'move' | 'end'; points: [number, number][] }
  /**
   * 화면을 재서 바로 앞 프레임의 probes 에 넣는다. centerRed: 지도 가운데 100x100 의 진한 빨강
   * 픽셀 수(HeatMap 가운데 색). SDK 가 붙였지만 그리지 않는 경우를 화면으로 잡는다.
   */
  | { t: 'probe'; name: 'centerRed' }
  /** 화면을 찍어 결과에 붙인다. 판정에는 쓰지 않는다. */
  | { t: 'shot'; name: string }
  /** 가상 시계로 돌지 않는 브라우저 일을 기다린다. ResizeObserver 등. */
  | { t: 'realtime'; ms: number };

/**
 * 한 프레임 동안 관찰한 지도 상태. 공개 API 로 읽을 수 있는 값만 담는다.
 * 지도 본체의 값(CoreFrame)에 기능별 픽스처(app/fixtures)가 읽은 값이 합쳐진다.
 */
export type TraceFrame = CoreFrame & FixtureFrame;

/** 지도 본체가 읽는 값. */
export type CoreFrame = {
  center: LL;
  zoom: number;
  /** 이 프레임에 발생한 지도 이벤트 */
  events: string[];
  /** 이 프레임에 호출된 지도 메서드 */
  calls: string[];
  /** 이 프레임에 불린 0.4 의 새 이벤트 prop(onZoomstart 등) */
  propCalls: string[];
  /** 이 프레임에 onZoomChanged 로 받은 값 */
  zoomReports: number[];
  /** 지도에 붙은 컨트롤 수 */
  controls: number;
  /** 지도 DOM 이 문서에 붙어 있는가 */
  attached: boolean;
  /** 지도가 아는 너비 */
  mapWidth: number;
  /** useKVO 로 읽은 zoom */
  kvoZoom: number;
  /** useKVO 로 읽은 center 위도 */
  kvoLat: number;
  /** 지금 지도 인스턴스의 번호. 새 인스턴스가 생기면 1 늘어난다. */
  mapId: number;
  /** 이 프레임 뒤에 잰 화면 값(probe 단계). 이름 → 값. */
  probes?: Record<string, number>;
  /** 지금 지도에 붙어 있는 Polyline·Circle·InfoWindow 이름(정렬). InfoWindow 는 열려 있으면 붙어 있다. */
  overlaysOnMap: string[];
  /** 지도 가운데 점의 계산된 CSS cursor */
  mapCursor: string;
  /** SDK 의 그리기 방식. 1 래스터, 2 GL. gl 을 요청해도 WebGL 을 못 쓰면 1 이다. */
  renderMode: number;
};

/** 위반이 있으면 설명을, 없으면 null 을 돌려준다. */
export type Assertion = (trace: TraceFrame[]) => string | null;

export type Scenario = {
  name: string;
  app: AppConfig;
  steps: Step[];
  expect: Assertion[];
  /** 알려진 버그. 실패해야 통과로 친다. 고치면 지운다. */
  knownIssue?: string;
  /**
   * 실행마다 값이 달라질 수 있는 trace 필드와 그 이유. 비교(`e2e/compare.ts`)에서 뺀다.
   * 판정(expect)은 이 필드의 정확한 프레임에 기대지 않게 쓴다.
   */
  unstable?: { fields: (keyof TraceFrame)[]; reason: string };
  /**
   * 이 시나리오가 쓰는 API 가 생긴 버전(`major.minor`). 비교 실행에서 이보다 오래된
   * 배포본은 건너뛴다. 동작만 다른 경우에는 쓰지 않는다. 그 차이가 비교의 대상이다.
   */
  since?: string;
};

/** 시나리오를 실행하는 환경. 프레임을 직접 넘길 수 있어야 한다. */
export interface ScenarioDriver {
  mount(app: AppConfig): Promise<void>;
  setProps(props: Partial<AppConfig>): Promise<void>;
  /** 16ms 를 넘기고 그 프레임의 관찰값을 돌려준다. */
  frame(): Promise<TraceFrame>;
  call(method: string, args: unknown[]): Promise<void>;
  mouse(kind: 'down' | 'move' | 'up', x: number, y: number): Promise<void>;
  wheel(x: number, y: number, deltaY: number): Promise<void>;
  clickCenter(): Promise<void>;
  touch(
    kind: 'start' | 'move' | 'end',
    points: [number, number][],
  ): Promise<void>;
  shot(name: string): Promise<void>;
  /** 화면 값을 잰다. 지원하지 않으면 null. */
  probe(name: 'centerRed'): Promise<number | null>;
  realtime(ms: number): Promise<void>;
}
