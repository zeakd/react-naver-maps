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

## 개발

```bash
pnpm install
pnpm -r run build && pnpm -r run lint && pnpm -r run test   # CI 와 같은 검사 (SDK mock)
```

실제 네이버맵 SDK 를 불러오는 검사는 CI 에서 돌리지 않으므로 SDK 로딩·인증과 관련된 변경에서는 직접 돌린다. 둘 다 `http://localhost:4321` 에서 실행되며, 저장소의 Maps 키는 이 주소에서만 인증된다.

```bash
cd packages/react-naver-maps
pnpm test:scenarios     # 실제 SDK 로 인증과 지도 동작을 프레임 단위로 검증
pnpm test:visual:cached  # 문서 예제 지도 스크린샷 비교 (website dev 서버를 띄움)
pnpm verify:frameworks  # 배포 형태 패키지를 Vite, Next, React Router, TanStack Start, Astro 에서 검증
```

스크린샷 기준 이미지는 네이버 지도 타일이 담겨 저장소에 두지 않는다. `RNM_VISUAL_BASELINES=<디렉터리>` 로 기준 위치를 지정하거나, 처음 한 번 `pnpm test:visual:cache` 로 로컬 기준을 만든다(`e2e/__screenshots__/`, git 제외).

- 시나리오는 `packages/react-naver-maps/e2e/scenarios/scenarios.ts` 에 있다. 가상 시계로 16ms 씩 넘겨 같은 시나리오는 같은 궤적을 낸다. 실패하면 `test-results/` 에 trace 와 영상이 남는다.
- 인증 실패는 지도 DOM 으로는 드러나지 않아 `navermap_authFailure` 콜백으로 판정한다.
- Node 버전은 `package.json` 의 `devEngines.runtime` 으로 고정한다. `pnpm` 으로 실행하는 명령은 이 버전으로 돈다.
- Playwright 브라우저는 `pnpm exec playwright install chromium` 으로 받는다.

## 라이선스

MIT
