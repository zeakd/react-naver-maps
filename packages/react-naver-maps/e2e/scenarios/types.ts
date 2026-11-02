/** 위도, 경도 */
export type LL = [number, number];

/** 시나리오가 올리는 앱의 설정. app.tsx 가 이 값으로 라이브러리를 렌더링한다. */
export type AppConfig = {
  /** props: center 를 그대로 내려준다. controlled: onCenterChanged 를 상태로 받아 되돌려준다. */
  mode: 'props' | 'controlled';
  center?: LL;
  zoom?: number;
  strict?: boolean;
  zoomControl?: boolean;
  submodules?: string[];
  /** 기본값은 app.tsx 의 NCP_KEY_ID */
  ncpKeyId?: string;
  /** NaverMap 의 key. 바꾸면 지도를 다시 만든다. */
  mapKey?: number;
  /** 인라인 핸들러가 있는 Marker 를 함께 올린다. */
  marker?: boolean;
  /** Marker 의 clickable */
  markerClickable?: boolean;
  /** onClick 만 있는 Circle 을 지도 중앙에 올린다. */
  circle?: boolean;
  /** Circle 의 clickable */
  circleClickable?: boolean;
  /** 값이 그대로인 path 로 Polyline 을 함께 올린다. */
  polyline?: boolean;
  /** padding, zoomControlOptions 를 인라인 객체로 넘긴다. */
  inlineOptions?: boolean;
  /** 값이 그대로인 인라인 anchor 로 열린 InfoWindow 를 함께 올린다. */
  infoWindow?: boolean;
  /** Container 너비. 기본값은 600 */
  containerWidth?: number;
  /** addons 의 useAutoResize 를 켠다. */
  autoResize?: boolean;
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
  /** 가상 시계로 돌지 않는 브라우저 일을 기다린다. ResizeObserver 등. */
  | { t: 'realtime'; ms: number };

/** 한 프레임 동안 관찰한 지도 상태. 공개 API 로 읽을 수 있는 값만 담는다. */
export type TraceFrame = {
  center: LL;
  zoom: number;
  /** 이 프레임에 발생한 지도 이벤트 */
  events: string[];
  /** 이 프레임에 호출된 지도 메서드 */
  calls: string[];
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
  /** 이 프레임까지 Marker 가 받은 클릭 수 */
  markerClicks: number;
  /** 이 프레임까지 Circle 이 받은 클릭 수 */
  circleClicks: number;
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
  realtime(ms: number): Promise<void>;
}
