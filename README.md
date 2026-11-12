# React Naver Maps

React Naver Maps는 [네이버 지도 JavaScript API v3](https://navermaps.github.io/maps.js.ncp/)의 비공식 React 라이브러리입니다. 지도와 마커, 정보 창을 컴포넌트로 그리고, 바뀌는 값은 props와 state로 다룹니다.

- React 19.0 이상, 런타임 의존성 없음 (peerDeps: react, react-dom. TypeScript를 쓰면 `@types/navermaps` 3.10.0 이상)
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

- [v0.3 문서](https://zeakd.github.io/react-naver-maps/0.3.0/)

## 참여하기

버그 제보와 PR은 [참여하기](https://zeakd.github.io/react-naver-maps/guides/contributing/) 안내를 봐 주세요. 저장소 구조와 검사는 [CONTRIBUTING.md](https://github.com/zeakd/react-naver-maps/blob/main/CONTRIBUTING.md)에 있습니다.

## 라이선스

MIT
