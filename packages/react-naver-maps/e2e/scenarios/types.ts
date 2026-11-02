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
};

export type Step =
  | { t: 'props'; props: Partial<AppConfig> }
  | { t: 'frames'; n: number }
  | { t: 'call'; method: string; args?: unknown[] }
  | { t: 'mouse'; kind: 'down' | 'move' | 'up'; x: number; y: number }
  | { t: 'wheel'; x: number; y: number; deltaY: number };

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
}
