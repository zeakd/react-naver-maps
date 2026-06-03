---
"react-naver-maps": patch
---

전체 컴포넌트 binding audit 라운드. props ↔ SDK 결합의 일관성을 정밀화하고, 발견된 버그를 수정하며, 누락된 옵션을 노출.

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
