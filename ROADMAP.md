# react-naver-maps v2 로드맵

React 19 전용 네이버 지도 라이브러리. 기존 v1 완전 대체.

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
- 상세: `research/references/PERFORMANCE-ANALYSIS.md`

### 코드 품질 (2026-03-15)

- Shape 5개 useOverlayLifecycle 통일
- CustomOverlay ref 지원
- InfoWindow position useControlledKVO 통일
- NCP 인증 키 4종 지원 (ncpKeyId, ncpClientId, govClientId, finClientId)
- Container render function children 지원

---

## 미정

### 공식 튜토리얼 1:1 매핑 예제

네이버맵 공식 튜토리얼의 UI를 v2 컴포넌트로 완전히 재현하는 예제.
7개: 지도 옵션, 지도 유형, 지도 경계, 지도 이동, Geolocation, 커스텀 컨트롤, 마커 클러스터.

### DX 개선 검토

- `useNavermaps()` + `new navermaps.LatLng()` 보일러플레이트 감소
- 3중 래핑(Provider → Container → NaverMap) 단순화
- controlled/uncontrolled 타입 분리 (동시 전달 방지)

### v1 대비 미구현

- `useOverlayLifecycle` export 여부 (v1의 `<Overlay>` 대체)
- `<Listener>` / `useListener()` (v2는 `on*` props로 대체)

---

## 설계 원칙

1. **런타임 의존성 0**: peerDeps만 react/react-dom 19
2. **omitUndefined 필수**: 네이버맵 생성자에 undefined 전달 시 초기화 실패
3. **KVO 단방향 동기화**: useControlledKVO는 구독 없이 렌더 시점 dirty diff
4. **cleanup 철저**: clearInstanceListeners + setMap(null)
5. **Suspense 네이티브**: use() + Promise 캐시 패턴
6. **useLayoutEffect**: 인스턴스 생성 + KVO setter는 paint 전 실행
7. **반복 허용**: 팩토리 추상화보다 개별 컴포넌트의 명확성 우선
8. **Map 전용 처리**: center/zoom/bounds는 morph/panTo/fitBounds 우선순위로 처리 (setCenter 사용 금지)
