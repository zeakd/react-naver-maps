---
'react-naver-maps': patch
---

버그 수정

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
