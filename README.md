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

## 문서

[zeakd.github.io/react-naver-maps](https://zeakd.github.io/react-naver-maps)

## 이전 버전

- [v0.1 문서](https://zeakd.github.io/react-naver-maps/0.1.0/) (React 17/18)
- [v0.0.13 문서](https://zeakd.github.io/react-naver-maps/0.0.13/)

## 라이선스

MIT
