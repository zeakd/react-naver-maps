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
pnpm check && pnpm -r run build && pnpm -r run test   # 단위 검사 (SDK mock)
```

실제 네이버맵 SDK 를 불러오는 검사는 `http://localhost:4321` 에서 실행된다. 저장소의 Maps 키는 이 주소에서만 인증되므로 한 번에 하나씩 돌린다. CI 는 `test:scenarios` 와 `verify:frameworks` 를 돌리고, 스크린샷 비교와 배포본 비교는 돌리지 않는다.

```bash
cd packages/react-naver-maps
pnpm test:scenarios     # 실제 SDK 로 인증과 지도 동작을 프레임 단위로 검증
pnpm test:visual:cached  # 문서 예제 지도 스크린샷 비교 (website dev 서버를 띄움)
pnpm verify:frameworks  # 배포 형태 패키지를 Vite, Next, React Router, TanStack Start, Astro 에서 검증
pnpm compare:scenarios  # 같은 시나리오를 npm 0.3.0 과 소스에 돌려 동작 차이를 표로 낸다
```

스크린샷 기준 이미지는 네이버 지도 타일이 담겨 저장소에 두지 않는다. `RNM_VISUAL_BASELINES=<디렉터리>` 로 기준 위치를 지정하거나, 처음 한 번 `pnpm test:visual:cache` 로 로컬 기준을 만든다(`e2e/__screenshots__/`, git 제외).

- 시나리오는 `packages/react-naver-maps/e2e/scenarios/scenarios.ts` 에 있다. 가상 시계로 16ms 씩 넘겨 같은 시나리오는 같은 궤적을 낸다. 실패하면 `test-results/` 에 trace 와 영상이 남는다.
- `compare:scenarios` 는 `e2e/scenarios/compare-expected.ts` 에 필드와 이유를 적은 차이만 허용한다. 다른 버전은 `pnpm compare:scenarios 0.2.2`, 지난 실행으로 표만 다시 내려면 `--reuse`.
- GL 시나리오는 GPU 로 WebGL 을 쓸 수 있을 때만 GL 로 돈다. SDK 는 성능 경고가 있는 WebGL(소프트웨어 렌더)에서 래스터로 바꾸고, 그러면 시나리오를 건너뛴다. GPU 가 없는 CI 에서는 건너뛴다.
- 터치는 Chrome 개발자 프로토콜로 손가락을 보낸다(`AppConfig.touch`).
- 인증 실패는 지도 DOM 으로는 드러나지 않아 `navermap_authFailure` 콜백으로 판정한다.
- Node 버전은 `package.json` 의 `devEngines.runtime` 으로 고정한다. `pnpm` 으로 실행하는 명령은 이 버전으로 돈다.
- Playwright 브라우저는 `pnpm exec playwright install chromium` 으로 받는다.

## 라이선스

MIT
