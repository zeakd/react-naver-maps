# react-naver-maps 로드맵

React 19 전용 네이버 지도 라이브러리. 0.2에서 다시 만들어 0.1 이전 API를 대체했다.

---

## 완료

### Phase 0+1: 프로젝트 세팅 + 코어 (2026-03-02)

- ESM only, tsc -b, vitest browser mode, oxlint/oxfmt
- 코어: loadScript, NavermapsProvider, Container, useNavermaps, useMap
- KVO: useKVO, useControlledKVO
- 컴포넌트: NaverMap, Marker

### Phase 2: 오버레이 시스템 (2026-03-15)

- 컴포넌트 8종: InfoWindow, GroundOverlay, CustomOverlay, Circle, Rectangle, Ellipse, Polygon, Polyline
- useOverlayLifecycle 공유 훅
- EventHandlerProps<E> 타입 시스템 (ShapeEvent, MarkerEvent, GroundOverlayEvent)
- StrokeStyle, FillStyle 공유 인터페이스
- 테스트 80개

### Phase 3: 타입 & DX (2026-03-15)

- omitUndefined 반환 타입 개선 (type assertion 8개 제거)
- 모든 public API JSDoc
- 에러 메시지 구체화 (Container/Provider 누락 시)

### Phase 4: Website (2026-03-15)

- Guides 4개: Introduction, Quickstart, Controlled vs Uncontrolled, 이벤트 핸들링
- Examples 5개: 마커, Circle, Shapes, InfoWindow, CustomOverlay
- API Reference 10개: 모든 컴포넌트 PropsTable

### 퍼포먼스 개선 (2026-03-15)

- useControlledKVO 재설계: useSyncExternalStore 제거, 렌더 시점 dirty diff
- NaverMap center/zoom/bounds 전용 처리: morph/panTo/fitBounds 우선순위
- 인스턴스 생성 useEffect → useLayoutEffect (빈 프레임 방지)
- Container inner div absolute 배치 복원

### 코드 품질 (2026-03-15)

- Shape 5개 useOverlayLifecycle 통일
- CustomOverlay ref 지원
- InfoWindow position useControlledKVO 통일
- 인증 키는 Maps의 ncpKeyId 하나만 받음 (0.3.0에서 ncpClientId·govClientId·finClientId 제거, #174)
- Container render function children 지원

### 0.4 (진행 중, 배포 전)

- 검증: 같은 시나리오를 배포본(0.3.0)과 소스에 돌려 동작 차이를 표로 낸다(`compare:scenarios`). GL, 터치, 앱 상태가 지도와 어긋나는 경우, React 수명(suspend, Activity) 시나리오.
- 동작: prop을 값으로 비교, 제스처 중 카메라 prop 보류, 숨겼다 보여도 같은 인스턴스(`binding/lifetime.ts`), 핸들러가 있는 도형은 clickable.
- 구조: 오버레이를 스펙 하나로 정의(`overlays/overlay-spec.tsx`).
- 추가: `BicycleLayer`, `CustomControl`, `GeoJson`, `react-naver-maps/addons`, 서브모듈 경로 `geocoder`, `visualization`, `drawing`, `panorama`.
- deprecated: controlled `bounds`, `centerPoint`, `defaultCenterPoint`.
- 안내: 0.3에서 0.4로 가이드.
- 문서 사이트: 네이버 공식 튜토리얼 88개를 React 예제로 옮기고 페이지마다 바꾼 점을 적는다. React 앱에서 자주 하는 일을 React 예제로 따로 둔다. 영역별 사이드바, 검색, 어두운 화면.

---

## 미정

### DX 개선 검토

- controlled/uncontrolled 타입 분리 (동시 전달 방지)

정한 것(0.4): 좌표는 `{ lat, lng }` 리터럴을 기본으로 쓰고 SDK 객체는 한 번만 만든다(문서 예제). `Provider → Container → NaverMap`은 그대로 둔다. Container는 자리와 DOM props를, NaverMap은 SDK props를 맡아 같은 이름의 prop(`onClick`, `draggable`)이 어느 쪽 뜻인지 컴포넌트가 정한다.

---

## 역할

네이버맵 SDK를 React로 옮기는 번역 계층이다.

1. SDK에 있는 기능은 prop, 이벤트, 마운트로 옮긴다.
2. 재렌더, StrictMode, 언마운트, SSR처럼 React와 만나서 생기는 문제는 라이브러리가 책임진다.
3. jQuery 식 명령형 API는 그대로 내보내지 않고 적당히 제약해 React 답게 푼다. 선언한 prop은 언제 바꿔도 동작해야 한다.
4. SDK에 없는 기능은 코어에 넣지 않고 `react-naver-maps/addons`로 뺀다. 기존 컴포넌트를 개선한 버전이나 새 컴포넌트도 여기 둔다.
5. 없던 전역을 만들지 않는다.
6. 그 밖의 SDK 특이 동작은 숨기지 않고 문서로 알린다.

코어(루트 진입 `src/index.ts`가 내보내는 것)는 `src/addons`를 모른다. addons는 코어의 공개 API만 쓴다.

SDK 서브모듈은 `react-naver-maps/<서브모듈>` 경로로 둔다(`src/geocoder`, `src/visualization`, `src/drawing`, `src/panorama`). 라이브러리가 서브모듈을 대신 불러오지 않고, 없으면 불러오는 법을 담은 에러를 낸다. 옮기는 범위는 SDK 공식 문서에 있는 클래스다.

## 설계 원칙

1. **런타임 의존성 0**: peerDeps만 react/react-dom 19
2. **omitUndefined 필수**: 네이버맵 생성자에 undefined 전달 시 초기화 실패
3. **KVO 단방향 동기화**: 구독 없이 렌더 시점에 맞춘다. 값으로 비교하고, SDK 값이 마지막으로 맞춘 직후와 달라졌으면(사용자 드래그 등) prop으로 되돌린다. 카메라(`center`, `zoom`)는 prop이 바뀔 때만 움직이고 제스처 중에는 보류한다
4. **수명은 한 곳에서**: `binding/lifetime.ts`. 숨김(Suspense, Activity, StrictMode)에는 떼고 다시 보이면 붙이며, 진짜 언마운트에서만 버린다(clearInstanceListeners + setMap(null))
5. **Suspense 네이티브**: use() + Promise 캐시 패턴
6. **useLayoutEffect**: 인스턴스 생성 + KVO setter는 paint 전 실행
7. **오버레이는 스펙으로**: `defineOverlay`의 표 하나에서 컴포넌트를 만든다. 예외는 스펙 필드(`initial`, `derived`, `afterCreate`, `keys`, `waitForReadyMap`)로 드러낸다
8. **Map 전용 처리**: center/zoom/bounds는 morph/panTo/fitBounds 우선순위로 처리 (setCenter 사용 금지)
