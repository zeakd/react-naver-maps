# react-naver-maps

## 0.4.0

구조와 키는 0.3 과 같습니다. 숨겼다 보여도 같은 지도를 쓰고, 드래그 중에는 `center`, `zoom` prop 을 넣지 않고, 같은 값의 새 객체로는 지도를 건드리지 않습니다. `GeoJson`, `Kml`, `Gpx`, `CustomControl` 등 새 컴포넌트와 서브모듈 하위 경로(`react-naver-maps/geocoder` 등)가 들어갑니다. 옮기는 법은 [0.3에서 0.4로](https://zeakd.github.io/react-naver-maps/guides/migration-from-03/) 를 봐 주세요.

### Minor Changes

- 숨겼다 보여도 같은 지도와 오버레이를 씁니다.

  - 지도 안의 컴포넌트가 suspend 했다 풀리거나 `<Activity>` 로 숨겼다 보이면 지도를 새로 만들고, 오버레이가 옛 지도에 남던 문제를 고쳤습니다.
  - 숨기는 동안 오버레이는 지도에서 떼고 지도는 영역을 숨깁니다. 다시 보이면 같은 인스턴스를 다시 붙이고, `open` 인 `InfoWindow` 는 다시 엽니다.
  - StrictMode 의 이중 실행에서도 인스턴스를 새로 만들지 않습니다. 숨겼다 보인 `Marker` 도 나중에 `clickable` 을 켜면 클릭을 받고, `DrawingManager` 는 `drawingMode` 를 지킵니다.

- 지도의 카메라(`center`, `zoom`)는 prop 이 바뀔 때만 움직이고, 사용자가 움직인 지도를 되돌리지 않습니다.

  - 지도를 끌거나 핀치하는 동안과 관성이 멈출 때까지 `center`, `zoom` prop 을 넣지 않고, 멈춘 뒤 마지막 값으로 맞춥니다. `onCenterChanged` 값을 반올림하는 등 가공해 되돌려주면 드래그 중 지도가 끌려가던 문제(GL 에서는 드래그가 거의 안 되던 문제)를 고쳤습니다. 화면에서 1px 안의 차이로는 움직이지 않습니다.
  - 지도가 최근 2초 안에 알려 준 위치와 같은 `center` prop 은 따르지 않습니다. 앱이 `onCenterChanged` 값을 늦게(비동기 store, transition, setTimeout) 되돌려줘도 지도가 지나온 자리로 당겨지며 흔들리지 않습니다. GL 의 정수가 아닌 `zoom` 도 같습니다. 사용자가 움직인 위치는 `onIdle` 에서 맞추는 것을 권장합니다.
  - GL 지도에서 `center`·`zoom` 을 1초 안에 연달아 바꾸면 애니메이션 없이 바로 옮겨, 움직이는 대상을 따라갈 때 뒤처지지 않습니다.
  - 래스터 지도는 실수 `zoom` 을 반올림해 쓰므로, 반올림해 같으면 `center` 만 옮깁니다.
  - `Panorama` 도 거리뷰를 누르고 있는 동안 `pov` 등 카메라 prop 을 보류합니다.

- prop 을 값으로 비교합니다. 렌더마다 새로 만든 같은 값으로는 SDK 를 부르지 않습니다.

  - `center={{ lat, lng }}`, `path={[...]}`, `icon={{ content, anchor: new navermaps.Point(...) }}` 처럼 인라인으로 만든 같은 값으로 렌더마다 setter 를 부르거나, 드래그한 지도가 원래 자리로 돌아가던 문제를 고쳤습니다.
  - `GroundOverlay` 는 `url`, `bounds` 가 정말 바뀔 때만 다시 만듭니다.
  - 이벤트 prop 의 핸들러가 바뀌기만 하면 SDK 리스너를 다시 붙이지 않습니다. 인라인 `onClick` 을 써도 됩니다.
  - 오버레이의 값을 지도에서 바꾸면(예: `draggable` Marker 끌기) 다음 렌더에서 prop 으로 되돌리는 것은 0.3 과 같습니다. 받아들이려면 `onDragend` 등으로 state 를 바꿉니다.

- 새 컴포넌트를 더했습니다.

  - `GeoJson`, `Kml`, `Gpx`: 지도의 데이터 레이어에 올립니다. `style`, 이벤트, `onPropertyChanged` 는 그 컴포넌트가 올린 feature 에만 적용됩니다.
  - `CustomControl`: React 내용을 지도의 컨트롤 자리에 그립니다.
  - `BicycleLayer`, `LabelLayer`, `Layer`(사용자 정의 레이어).
  - `Polygon`, `Polyline`, `Rectangle`, `Ellipse` 의 `editable`(꼭짓점을 끌어 고치기, drawing 서브모듈 필요).

  ```tsx
  <NaverMap>
    <GeoJson
      data={regions}
      style={(f) => ({ fillColor: f.getProperty('color') })}
    />
    <CustomControl position="TOP_RIGHT">
      <button onClick={goHome}>처음 위치</button>
    </CustomControl>
    <BicycleLayer />
  </NaverMap>
  ```

- SDK 서브모듈을 하위 경로로 씁니다. 서브모듈을 불러오지 않고 쓰면 `submodules` 로 불러오는 법을 담은 에러를 냅니다.

  - `react-naver-maps/geocoder`: `geocode`, `reverseGeocode` 를 Promise 로 씁니다.
  - `react-naver-maps/visualization`: `HeatMap`, `DotMap`.
  - `react-naver-maps/drawing`: `DrawingManager`. 그린 도형은 `onDrawingAdded` 등 이벤트로 받습니다.
  - `react-naver-maps/panorama`: 거리뷰 `Panorama`(`Container` 안에 둡니다)와 항공뷰 지점 `FlightSpot`. `Panorama` 의 자식으로 `Marker`, `InfoWindow` 를 두면 거리뷰 위에 그립니다. `size`, `onInit` 을 받고 `position`, `pov` 는 지도의 카메라처럼 바뀔 때만 맞춥니다.
  - `react-naver-maps/addons`: SDK 에 없는 기능. `useAutoResize` 는 지도·거리뷰 영역 크기가 바뀌면 맞춥니다.

  ```ts
  import { geocode } from 'react-naver-maps/geocoder';
  const { addresses } = await geocode(navermaps, { query: '불정로 6' });
  ```

- 공식 문서에 있는 옵션과 이벤트를 prop 으로 받습니다.

  - `NaverMap`, `Marker`, `InfoWindow`, 도형이 목록에 없는 SDK 옵션도 받습니다. SDK 에 새 옵션이 생겨도 라이브러리를 올리지 않고 쓸 수 있습니다.
  - 오버레이의 변경 이벤트를 `on*Changed(값)` 로 받습니다(예: `Marker` 의 `onPositionChanged`). `Marker` 의 `onIconLoaded`, `collisionBehavior`, `collisionBoxSize`(GL).
  - `NaverMap`: `onZoomstart`, `onZoomend`, `onZoom`(GL), `onAddLayer`, `onRemoveLayer`. `onKeydown`·`onKeyup` 인자는 `{ keyboardEvent }`. `mapTypeId` 는 사용자 지도 유형 id 도 받고, 컨트롤 옵션은 모든 필드가 선택입니다.
  - `InfoWindow`: `content` 에 HTML 요소, `pixelOffset` 리터럴, `autoPanPadding`. `CustomOverlay` 의 `position` 에 Point, `Polygon`·`Polyline` 의 `paths`·`path` 에 KVOArray.
  - `HeatMap`·`DotMap` 의 `data` 에 `{ weight, location }` 리터럴, `HeatMap` 의 `colorMapInReverse`. `DrawingManager` 의 도형 스타일 옵션과 이벤트 인자의 `id`, `name`.

- SDK 상수를 받는 prop 이 이름도 받습니다. SDK 상수도 그대로 받고, 없는 이름이면 쓸 수 있는 이름을 담은 오류를 냅니다.

  ```tsx
  <NaverMap zoomControl zoomControlOptions={{ position: 'TOP_RIGHT', style: 'SMALL' }} />
  <Marker animation="BOUNCE" />
  <DrawingManager drawingMode="POLYGON" />
  ```

- `NavermapsProvider` 에 `language`(지도 언어 ko·en·zh·ja)와 `onAuthFailure`(인증 실패)를 더했습니다. `submodules` 는 SDK 서브모듈 이름만 받습니다.

  `@types/navermaps` 를 선택 peer `^3.10.0` 으로 둡니다. TypeScript 를 쓰는 앱은 함께 올려 주세요. 3.10.0 부터 공식 문서의 멤버가 타입에 들어 있어, 라이브러리가 따로 하던 타입 보강은 없앴습니다.

- 도형(`Circle`, `Ellipse`, `Rectangle`, `Polygon`, `Polyline`)에 `onClick` 같은 포인터 핸들러가 있으면 `clickable` 을 켭니다. SDK 기본은 꺼져 있어 0.3 에서는 핸들러가 불리지 않았습니다. 도형 위 클릭이 지도로 가야 하면 `clickable={false}` 를 적어 주세요.
- `NaverMap` 의 controlled `bounds`, `centerPoint`, `defaultCenterPoint` 는 deprecated 입니다. 개발 모드에서 한 번 경고하고 다음 버전에서 없앱니다. 처음 영역은 `defaultBounds`, 바꿀 때는 `map.fitBounds()`, 중심은 `center` 를 써 주세요.

  `Container` 가 `ref` 를 받습니다(바깥 div).

### Patch Changes

- 버그 수정

  - `key` 로 `NaverMap` 을 다시 만들면 새 지도가 빈 화면이 되던 문제
  - 페이지가 maps.js 를 먼저 넣고 load 뒤에 마운트하면 지도가 뜨지 않던 문제. SDK 스크립트는 한 번에 하나만 넣고, 로딩 중의 다른 요청은 처음 요청에 합류합니다
  - 서버 렌더에서 `Container` 밖의 `useNavermaps()` 가 서버 렌더를 멈추던 문제. 가장 가까운 `<Suspense>` 가 fallback 을 내보냅니다
  - 인증 실패 뒤 다시 렌더하거나 내릴 때, `InfoWindow` 의 `content` 를 바꿀 때 앱이 내려가던 문제. 인증 실패 뒤 `NaverMap`·`Panorama` 만 내려도 지도 element 를 뺍니다
  - 투영을 생략한 사용자 지도 유형에서 `center` 리터럴로 SDK 가 던지던 문제. `Layer` 의 `mapTypes` 도 `projection` 없는 지도 유형을 받습니다
  - 새 `mapTypes` 와 거기에만 있는 `mapTypeId` 를 함께 바꾸면 지도가 내려가던 문제, `mapTypes` 에 `MapTypeRegistry` 를 넘기고 다시 렌더하면 멈추던 문제
  - `Marker` 의 `animation` 이 DROP 뒤 다시 렌더하면 또 떨어지던 문제(바뀔 때만 적용하고 `null` 로 BOUNCE 를 멈춥니다), `NaverMap` 의 `cursor` 첫 값이 적용되지 않던 문제
  - `InfoWindow` 의 `content` 와 `open` 을 함께 바꾸면 옛 내용으로 열던 문제, 인라인 `anchor` 로 렌더마다 닫혔다 열리던 문제, suspend 뒤 열어 둔 정보 창이 닫힌 채 남던 문제
  - 가까운 `center` 와 큰 `zoom` 을 함께 바꾸면 `center` 를 버리던 문제, 한 프레임 안에 `center` prop 이 되돌아오면 중간 값으로 가던 문제, 드래그 중 `Activity` 로 숨겼다 보이면 카메라 prop 을 계속 무시하던 문제
  - `clickable` 을 나중에 켠 `Marker` 가 이벤트를 받지 못하던 문제
  - `useKVO` 로 `center`, `zoom` 을 읽으면 갱신되지 않던 문제, gl 서브모듈에서 `onZoomChanged` 값이 `getZoom()` 과 다르던 문제
  - 지도 init 전에 올렸다 내린 `HeatMap`·`DotMap`·`CustomControl`·`DrawingManager` 가 init 뒤에 붙던 문제, init 전에 바꾼 `drawingMode` 가 돌아가던 문제, init 리스너가 남던 문제
  - `GeoJson`·`Kml`·`Gpx` 의 `autoStyle` 을 바꿔도 적용되지 않던 문제, 숨겼다 보인 `TrafficLayer` 가 `autoRefresh={false}` 를 잃던 문제
  - `geocode` 결과의 `addressElements[].types` 를 배열로 고쳤습니다. 하위 경로만 가져와도 SDK 타입 보강이 들어갑니다
  - `Marker` 의 `onMousemove` 를 뺐습니다(SDK 마커가 내지 않아 불린 적이 없습니다)
  - 개발 모드 경고: `blankTileImage` 를 바꿀 때(SDK 가 생성 때만 읽음), `editable` 과 controlled `paths`/`path` 를 함께 줄 때, `gl` 인데 gl 서브모듈이 없거나 다른 서브모듈과 함께 불렀을 때, `customStyleId` 지도에 내장 레이어를 올릴 때
  - 패키지에 빌드 캐시(`dist/tsconfig.tsbuildinfo`)를 넣지 않습니다

## 0.3.0

### Minor Changes

- fe5edd3: 인증 키 옵션을 `ncpKeyId` 하나로 정리. AI NAVER API 지도 API 종료(2026-11-24)에 맞춰 `ncpClientId`·`govClientId`·`finClientId` 를 제거했다. 이 옵션만 넘기면 제거 안내 에러를 던진다. (#174)

  `useNavermaps` 가 따로 들고 있던 Promise 캐시를 없애고 `loadScript` 캐시 하나만 쓴다. 스크립트 로드에 실패하면 다음 렌더에서 다시 시도한다.

### Patch Changes

- 7196830: StrictMode(dev)의 mount → cleanup → setup 에서 NaverMap 이 지도를 destroy 하고 새로 만들던 문제 수정. destroy 를 microtask 로 미뤄 다시 실행된 setup 이 기존 인스턴스를 재사용한다. 지도가 두 번 초기화되며 로고·축척 컨트롤이 두 벌 남던 현상을 고친다. gl 서브모듈에서 보고된 인증 실패(#171)와 같은 지점의 수정이다.

## 0.2.2

### Patch Changes

- 0127e00: 전체 컴포넌트 binding audit 라운드. props ↔ SDK 결합의 일관성을 정밀화하고, 발견된 버그를 수정하며, 누락된 옵션을 노출.

  ### 라이브러리 코어
  - `useControlledKVO`: setter 우선순위를 `setX > setOptions > set`로 재정의. Map의 옵션이 별도 `_mapOptions`에 저장되는 경우(draggable, scaleControl, mapTypeId 등 거의 모든 NaverMap 옵션)를 정확히 라우팅. 기존엔 `target.set(key, value)` 직접 호출이라 SDK가 무시하던 케이스 다수.
  - `useKVO`: Map 옵션 키 구독 시 `_mapOptions`로 listener/getter 라우팅. `useKVO(map, 'draggable')` 등이 정상 발화 수신.

  ### 컴포넌트 버그 수정
  - NaverMap: `minZoom`/`maxZoom`을 static에서 controlled로 이동. 런타임 변경 가능.
  - NaverMap: `onInit/onIdle/onTilesloaded` 등록을 `useEffect` → `useLayoutEffect`로 이동. SDK 동기 발화 케이스에서 init 누락 방지.
  - TrafficLayer: `autoRefresh` 미지정 시 `endAutoRefresh` 호출하지 않음 (이전엔 강제 비활성화).
  - InfoWindow: `setOptions(obj)` 일괄 호출을 per-key `useControlledKVO`로 전환. 인라인 객체 props 시 폭주 방지.
  - GroundOverlay: SDK가 발화하지 않는 mouseover/mouseout/mousemove 이벤트 prop 제거 (타입 축소). `dblclick`은 click 리스너가 연속 클릭을 합성 발화하므로 유지.
  - CustomOverlay: `pane` static 명시. position/anchor를 `kvoEquals` 비교 후 호출.
  - NaverMap: `logoControl` 분류 정밀화 — SDK가 `false`를 거부하는 일방향 controlled. `false` 시도 시 dev 안내.

  ### 신규 controlled props
  - NaverMap: `cursor` (드래그 중 SDK 자체 토글과 충돌 가능 — JSDoc 주의 명시), `tilt` (+`onTiltChanged`), `rotation` (+`onRotationChanged`)
  - NaverMap static: `repeatX`, `gl`, `customStyleId`, `useStyleMap`, `tileDuration` (SDK에 setter/`_changed` 없이 타일 생성 시에만 읽힘)
  - GroundOverlay: `crossOrigin`
  - Polygon/Polyline: `simplifyLevel`

  ### 개발자 경험
  - 신규 internal hook `useStaticProp` — static prop이 마운트 후 변경되면 dev에서 console.warn. production 빌드는 dead-code-elimination. undefined grace period로 비동기 prop 패턴 false positive 회피.

  ### 예제
  - `examples/map-types`: `MapTypeId` enum 실값 사용 (대문자 → 소문자).
  - `examples/map-options`: `kineticPan` 초기값을 SDK 기본과 일치.
  - `examples/map-geolocation`: 공식 tutorial 동작과 정렬 (`open` prop 명시 + 콘텐츠 스타일).

  ### 회귀 테스트
  - 121개 → **174개** 통과. 모든 fix 시나리오 커버. `event-types.spec.ts`는 vitest `typecheck`로 실제 평가(이전엔 런타임 no-op).

  ### Breaking 가능성 (사실상 없음)
  - GroundOverlay 이벤트 타입 축소: 기존 코드에서 `onMouseover`/`onMouseout`/`onMousemove`를 사용했더라도 SDK가 발화하지 않았으므로 실제 동작 변화 없음. (`onDblclick`은 유지)
  - CustomOverlay `pane` 변경: 이전에도 무시되던 동작이 이제 dev 경고로 명시.

## 0.2.1

### Patch Changes

- d74d88a: fix(load-script): submodules 로드 회귀 수정 (#159)

  0.2.0에서 `submodules` 옵션이 무력화되던 두 회귀를 수정한다.

  - URL의 쉼표가 `%2C`로 인코딩되어 submodule 청크가 404나던 문제 → raw 쉼표 복원
  - submodule attach(`onJSContentLoaded`) 전에 resolve하던 문제 → attach 완료까지 대기

  Closes #158

## 0.2.0

### Minor Changes

- e08a63b: React 19 전용으로 재작성. 네이버맵 SDK 충실성 우선.

  - 오버레이 컴포넌트 11종: NaverMap, Marker, InfoWindow, GroundOverlay, CustomOverlay, Circle, Rectangle, Ellipse, Polygon, Polyline, Container
  - Layer 컴포넌트 3종: CadastralLayer, StreetLayer, TrafficLayer
  - useOverlay: 바닐라 OverlayView 상속 객체를 React 생명주기에 연결
  - useListener: 네이버맵 네이티브 이벤트 escape hatch (콜백 안정화)
  - useKVO, useControlledKVO: KVO 속성 감시 및 동기화
  - Suspense 지원: React 19 use()와 스크립트 로딩 통합
  - 성능 개선: KVO 구독 제거, 렌더 시점 dirty diff

## 0.1.5

### Patch Changes

- 228aa73: Fix promise caching and error handling in loadNavermapsScript, replace deprecated lodash packages with lodash-es

## 0.1.4

### Patch Changes

- b8ae0a7: 신규 client key 이름 ncpKeyId를 사용가능하도록 업데이트

## 0.1.3

### Patch Changes

- 00ff206: update naver host openapi -> oapi

## 0.1.2

### Patch Changes

- update package.json

## 0.1.1

### Patch Changes

- deprecated alert을 위한 RenderAfterNavermapsLoaded 추가

## 0.1.0

### Major Changes

- 50c7d39: release v0.1.0
- 894ccb1: change react support version, use jsx-runtime
