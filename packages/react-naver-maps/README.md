# react-naver-maps

[Naver Maps JavaScript API v3](https://navermaps.github.io/maps.js.ncp/)의 Non-Official React 컴포넌트 라이브러리입니다.

네이버맵의 기본 기능을 최대한 유지하면서, React에서 다루기 쉬운 인터페이스를 제공합니다.

- React 19 전용, 런타임 의존성 없음 (peerDeps: react, react-dom)
- TypeScript 지원 (`@types/navermaps` 기반)
- Suspense 기반 스크립트 로딩

## 설치

```bash
npm install react-naver-maps
```

React 19 이상이 필요합니다.

## 사용법

```tsx
import {
  NavermapsProvider,
  Container,
  NaverMap,
  Marker,
} from 'react-naver-maps';

function App() {
  return (
    <NavermapsProvider ncpKeyId="YOUR_NCP_KEY_ID">
      <Container style={{ width: '100%', height: '400px' }}>
        <NaverMap
          defaultCenter={{ lat: 37.5666, lng: 126.9784 }}
          defaultZoom={16}
        >
          <Marker defaultPosition={{ lat: 37.5666, lng: 126.9784 }} />
        </NaverMap>
      </Container>
    </NavermapsProvider>
  );
}
```

## 0.2의 새 기능

- **오버레이 컴포넌트 11종**: NaverMap, Marker, InfoWindow, GroundOverlay, CustomOverlay, Circle, Rectangle, Ellipse, Polygon, Polyline, Container
- **Layer 컴포넌트 3종**: CadastralLayer, StreetLayer, TrafficLayer
- **useOverlay**: 바닐라 OverlayView 상속 객체를 React 생명주기에 연결. 네이버맵 공식 [CustomOverlay 패턴](https://navermaps.github.io/maps.js.ncp/docs/tutorial-6-CustomOverlay.html)을 그대로 사용 가능
- **useListener**: 네이버맵 네이티브 이벤트 escape hatch. 인라인 함수를 전달해도 리스너 재구독 없음
- **Suspense 지원**: 스크립트 로딩을 React 19 `use()`와 통합
- **성능 개선**: KVO 구독 제거, 렌더 시점 dirty diff로 드래그 중 불필요한 리렌더 방지

## 문서

[zeakd.github.io/react-naver-maps](https://zeakd.github.io/react-naver-maps)

## 라이선스

MIT
