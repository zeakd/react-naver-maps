# react-naver-maps

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
