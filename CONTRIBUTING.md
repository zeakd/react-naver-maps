# 기여 안내

이슈를 남기는 법, 개발 환경과 changeset은 문서 사이트의 [참여하기](https://zeakd.github.io/react-naver-maps/guides/contributing/)에 있습니다. 여기는 저장소 구조와 검사를 더 자세히 적습니다.

라이브러리 소스(`packages/react-naver-maps/src`)는 역할별 폴더로 나뉜다. 각 폴더의 테스트는 그 폴더의 `__tests__`에 있다.

```
src/
  index.ts        루트 진입(react-naver-maps)
  sdk/            SDK 불러오기(NavermapsProvider, loadScript), 이름으로 받는 상수, 리스너, SDK 타입 보강
  binding/        SDK 인스턴스와 prop 을 잇는 부품: 수명(lifetime), 값 동기화, 최신 핸들러, 생성 때만 쓰는 prop 경고
  map/            NaverMap, Container, 카메라 판정(camera/)
  overlays/       Marker, InfoWindow, CustomOverlay, GroundOverlay, CustomControl, 오버레이 표(overlay-spec)와 이벤트
  shapes/         Circle, Ellipse, Polygon, Polyline, Rectangle, 도형 편집
  layers/         내장 레이어와 사용자 Layer
  data/           GeoJson, Gpx, Kml(데이터 레이어)
  hooks/          공개 훅(useNavermaps, useMap, useKVO, useListener, useOverlay)
  addons/ drawing/ geocoder/ panorama/ visualization/   하위 경로 진입(react-naver-maps/<이름>)
  __tests__/      단위 테스트의 SDK 가짜와 그 계약
```

```bash
pnpm install
pnpm check && pnpm -r run build && pnpm -r run test   # 단위 검사 (SDK mock)
```

라이브러리 소스를 바꾸고 changeset을 더한 PR은 문서 사이트(`website/src/content/docs/`)도 함께 바꾼다. CI가 `node scripts/docs-with-changeset.mts`로 확인한다. 문서가 필요 없는 변경이면 PR 본문에 `docs: none (이유)`를 한 줄 적는다.

문서 사이트의 내부 링크는 `/react-naver-maps/<분류>/<이름>/`처럼 사이트 접두사를 넣은 절대 경로로 쓴다. 빌드한 사이트의 링크가 실제 페이지로 가는지 CI가 `node scripts/check-site-links.mts`로 확인한다.

단위 검사는 SDK 가짜 하나(`packages/react-naver-maps/src/__tests__/sdk-fake.ts`)를 쓴다. 가짜가 기대는 SDK 성질(`sdk-contract.ts`)은 가짜와 실제 SDK(`e2e/scenarios/sdk-contract.spec.ts`)에서 함께 확인한다. 테스트는 SDK로 이벤트를 쏘고 핸들러·리스너 수·SDK 상태를 본다. 라이브러리가 SDK를 몇 번 불렀는지는 그 횟수가 계약일 때만 본다.

실제 네이버맵 SDK를 불러오는 검사는 `http://localhost:4321`에서 실행된다. 저장소의 Maps 키는 이 주소에서만 인증되므로 한 번에 하나씩 돌린다. 실행은 포트를 잠그고(`~/.cache/react-naver-maps/port-4321.lock`), 다른 실행이 잡고 있으면 그 실행을 알려 주고 시작하지 않는다. 강제로 끝난 실행(SIGKILL 등)이 남긴 잠금은 저절로 치우지 않고 지울 파일을 알려 준다. 떠 있는 서버를 재사용할 때는 그 서버가 이 작업 트리에서 뜬 것인지 확인한다(`e2e/port.ts`). CI는 `test:scenarios`와 `verify:frameworks`를 돌리고, 스크린샷 비교와 배포본 비교는 돌리지 않는다.

```bash
cd packages/react-naver-maps
pnpm test:scenarios     # 실제 SDK 로 인증과 지도 동작을 프레임 단위로 검증
pnpm test:visual:cached  # 문서 예제 지도 스크린샷 비교 (website dev 서버를 띄움)
pnpm verify:frameworks  # 배포 형태 패키지를 Vite, Next, React Router, TanStack Start, Astro 에서 검증
pnpm compare:scenarios  # 같은 시나리오를 npm 0.3.0 과 소스에 돌려 동작 차이를 표로 낸다
pnpm compare:scenarios git:v0.4  # 그 커밋을 빌드해 기준선으로 쓴다(내부 정리의 동작 보존 확인)
pnpm compare:scenarios harness:v0.4  # 그 커밋의 하네스로 돈 궤적과 비교한다(하네스 정리의 동작 보존 확인)
pnpm compare:types git:v0.4      # 공개 타입(진입점마다 내보내는 이름과 타입)을 그 커밋과 비교
```

스크린샷 기준 이미지는 네이버 지도 타일이 담겨 저장소에 두지 않는다. `RNM_VISUAL_BASELINES=<디렉터리>`로 기준 위치를 지정하거나, 처음 한 번 `pnpm test:visual:cache`로 로컬 기준을 만든다(`e2e/__screenshots__/`, git 제외).

- 시나리오는 `packages/react-naver-maps/e2e/scenarios/cases/`에 영역별로 있고 `scenarios.ts`가 이어 붙인다. 지도에 올리는 기능은 `app/fixtures/`에 기능별 파일로 있다(더하는 법은 `app/fixtures/index.ts` 맨 위). 가상 시계로 16ms 씩 넘겨 같은 시나리오는 같은 궤적을 낸다. 실패하면 `test-results/`에 trace와 영상이 남는다.
- `compare:scenarios`는 배포 버전과의 차이 중 `e2e/scenarios/compare-expected.ts`에 필드와 이유를 적은 것만 허용한다. 프레임 필드는 선언하는 곳 옆에 비교 방법(동작·화면 픽셀·측정값·생긴 버전)을 적어야 하고, 분류 없는 필드가 궤적에 나오면 비교가 실패한다(`e2e/scenarios/fields.ts`). 다른 버전은 `pnpm compare:scenarios 0.2.2`, 지난 실행으로 표만 다시 내려면 `--reuse`.
- `git:<ref>` 기준선은 그 커밋을 임시 작업 트리에서 새로 빌드해 쓴다(`e2e/baseline.ts`). 허용 목록이 없어 차이가 하나라도 나면 실패다. 동작을 바꾸는 변경은 정리와 다른 PR로 나눈다.
- `git:<ref>`는 라이브러리만 바꿔 끼우고 하네스(`e2e/scenarios`)는 지금 것을 쓴다. 하네스를 바꾼 변경은 `harness:<ref>`로 확인한다. 그 커밋을 임시 작업 트리에서 그 트리의 하네스로 돌리며, 라이브러리 소스(`src/`)가 지금과 다르면 시작하지 않는다. `harness:HEAD`는 같은 코드끼리 돌려 실행마다 흔들리는 필드를 찾는다.
- GL 시나리오는 GPU로 WebGL을 쓸 수 있을 때만 GL로 돈다. SDK는 성능 경고가 있는 WebGL(소프트웨어 렌더)에서 래스터로 바꾸고, 그러면 시나리오를 건너뛴다. GPU가 없는 CI에서는 건너뛴다.
- 터치는 Chrome 개발자 프로토콜로 손가락을 보낸다(`AppConfig.touch`).
- 인증 실패는 지도 DOM으로는 드러나지 않아 `navermap_authFailure` 콜백으로 판정한다.
- Node 버전은 `package.json`의 `devEngines.runtime`으로 고정한다. `pnpm`으로 실행하는 명령은 이 버전으로 돈다.
- Playwright 브라우저는 `pnpm exec playwright install chromium`으로 받는다.
- 다른 React 버전으로 돌리려면 `pnpm --filter react-naver-maps add -D react@19.0.9 react-dom@19.0.9` 뒤에 단위 테스트와 `test:scenarios`를 돌리고 `package.json`·`pnpm-lock.yaml`을 되돌린다. React 19.2 전에는 `Activity`가 없어 하네스가 감싸지 않고 Activity 시나리오는 건너뛴다.

