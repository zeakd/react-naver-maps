/** 위도, 경도 */
export type LL = [number, number];

/** 시나리오가 올리는 앱의 설정. app.tsx 가 이 값으로 라이브러리를 렌더링한다. */
export type AppConfig = {
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
  /** 기본값은 app.tsx 의 NCP_KEY_ID */
  ncpKeyId?: string;
  /** NaverMap 의 key. 바꾸면 지도를 다시 만든다. */
  mapKey?: number;
  /** 인라인 핸들러가 있는 Marker 를 함께 올린다. */
  marker?: boolean;
  /** Marker 의 clickable */
  markerClickable?: boolean;
  /** Marker 를 draggable 로 올린다. position 은 고정값이고 onDragend 로 상태를 갱신하지 않는다. */
  markerDraggable?: boolean;
  /** Marker icon 을 렌더마다 새로 만든 같은 값(content 문자열, anchor Point)으로 넘긴다. */
  markerInlineIcon?: boolean;
  /** onClick 만 있는 Circle 을 지도 중앙에 올린다. */
  circle?: boolean;
  /** Circle 의 clickable */
  circleClickable?: boolean;
  /** 값이 그대로인 path 로 Polyline 을 함께 올린다. */
  polyline?: boolean;
  /** polyline 의 path 를 렌더마다 새 배열(같은 좌표)로 넘긴다. */
  polylineInline?: boolean;
  /** padding, zoomControlOptions 를 인라인 객체로 넘긴다. */
  inlineOptions?: boolean;
  /** 값이 그대로인 인라인 anchor 로 열린 InfoWindow 를 함께 올린다. */
  infoWindow?: boolean;
  /** Container 너비. 기본값은 600 */
  containerWidth?: number;
  /** addons 의 useAutoResize 를 켠다. */
  autoResize?: boolean;
  /** 값이 바뀌면 지도 안에서 200ms(가상 시계) 동안 suspend 하는 자식을 올린다. */
  suspendKey?: number;
  /** 지도(Container 안)를 Activity 로 감싼다. */
  mapActivity?: 'visible' | 'hidden';
  /** DrawingManager 를 이 drawingMode 로 올린다. submodules 에 'drawing' 이 있어야 한다. */
  drawingMode?: number;
  /** DotMap 을 이 fillColor 로 올린다. submodules 에 'visualization' 이 있어야 한다. overlaysOnMap 에 'dotMap'. */
  dotMapFill?: string;
  /** HeatMap 을 이 opacity 로 올린다. submodules 에 'visualization' 이 있어야 한다. overlaysOnMap 에 'heatMap'. */
  heatMapOpacity?: number;
  /** 지도 중앙을 덮는 다각형 하나를 GeoJson 으로 올린다. 값은 fillColor. */
  geoJsonFill?: string;
  /** CustomControl 을 이 자리(naver.maps.Position 값)에 버튼과 함께 올린다. */
  customControlPosition?: number;
  /** BicycleLayer 를 올린다. overlaysOnMap 에 'bicycle' 로 나온다. */
  bicycleLayer?: boolean;
  /** GroundOverlay 를 이 url 로 올린다. bounds 는 렌더마다 새로 만든 같은 값이다. */
  groundOverlayUrl?: string;
  /** Polyline, Circle, InfoWindow 를 함께 Activity 로 감싼다. */
  overlaysActivity?: 'visible' | 'hidden';
  /** Marker 를 Activity 로 감싼다. marker 가 있어야 한다. */
  markerActivity?: 'visible' | 'hidden';
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
  /** Marker 가 있으면 그 위치 */
  markerPosition: LL | null;
  /** 지금 지도 인스턴스의 번호. 새 인스턴스가 생기면 1 늘어난다. */
  mapId: number;
  /** Marker 가 있으면 지금 지도에 붙어 있는가 */
  markerOnMap: boolean | null;
  /** DrawingManager 가 있으면 그린 도형 수(getDrawings) */
  drawings: number | null;
  /** 이 프레임까지 onDrawingAdded 를 받은 수 */
  drawingAdded: number;
  /** 이 프레임 뒤에 잰 화면 값(probe 단계). 이름 → 값. */
  probes?: Record<string, number>;
  /** HeatMap 이 있으면 그 opacity(SDK 값) */
  heatMapOpacity: number | null;
  /** 데이터 레이어의 feature 수 */
  dataFeatures: number;
  /** 첫 feature 의 첫 overlay fillColor */
  dataFillColor: string | null;
  /** 이 프레임까지 GeoJson onClick 이 feature 와 함께 받은 수 */
  geoJsonClicks: number;
  /** CustomControl 이 들어 있는 컨트롤 자리(Position 값). 없으면 null */
  customControlAt: number | null;
  /** CustomControl element 안에 그려진 버튼 글자 */
  customControlText: string | null;
  /** 지금까지 만들어진 GroundOverlay 인스턴스 수 */
  groundOverlays: number;
  /** 지금 지도에 붙어 있는 Polyline·Circle·InfoWindow 이름(정렬). InfoWindow 는 열려 있으면 붙어 있다. */
  overlaysOnMap: string[];
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
