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

## 개발

```bash
pnpm install
pnpm -r run build && pnpm -r run lint && pnpm -r run test   # CI 와 같은 검사 (SDK mock)
```

실제 네이버맵 SDK 를 불러오는 검사는 CI 에서 돌리지 않으므로 SDK 로딩·인증과 관련된 변경에서는 직접 돌린다. 둘 다 `http://localhost:4321` 에서 실행되며, 저장소의 Maps 키는 이 주소에서만 인증된다.

```bash
cd packages/react-naver-maps
pnpm test:browser        # smoke: 스크립트 로드·인증·지도 렌더 (Playwright Chromium)
pnpm test:visual:cached  # 문서 예제 지도 스크린샷 비교 (website dev 서버를 띄움)
```

- 인증 실패는 지도 DOM 으로는 드러나지 않아 smoke 가 `navermap_authFailure` 콜백으로 판정한다. 다른 키를 쓰려면 `VITE_NCP_KEY_ID` 로 넘긴다.
- Playwright 브라우저는 `pnpm exec playwright install chromium` 으로 받는다. Node 26.8.1 에서는 압축 해제 단계에서 멈춘 적이 있어(2026-11) Node 24 로 설치했다.

## 라이선스

MIT
