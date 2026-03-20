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
