import * as path from 'path';
import { defineConfig } from '@playwright/test';

// 문서 사이트 예제를 실제 네이버맵 SDK로 띄워 지도 영역을 스크린샷 비교한다.
//
// 예제는 Maps 키(ncpKeyId)를 쓰고, 이 키의 Web 서비스 URL 에 등록된 로컬 주소는
// http://localhost:4321 (Astro dev 기본 포트)이다. 다른 포트에서는 인증이 실패한다.
const PORT = 4321;

// 기준 스크린샷에는 네이버 지도 타일이 담기므로 저장소에 두지 않는다.
// RNM_VISUAL_BASELINES 로 기준 디렉터리를 지정하고, 없으면 git 에서 제외된
// e2e/__screenshots__/ 를 쓴다(처음엔 test:visual:update 로 만든다).
const BASELINES = process.env.RNM_VISUAL_BASELINES
  ? path.resolve(process.env.RNM_VISUAL_BASELINES)
  : '{testDir}/__screenshots__';

export default defineConfig({
  testDir: '.',
  testMatch: ['visual.spec.ts', 'examples.spec.ts'],
  timeout: 60000,
  snapshotPathTemplate: `${BASELINES}/{arg}{ext}`,
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1378, height: 900 },
  },
  webServer: {
    // RNM_SITE=build 면 라이브러리와 사이트를 빌드해 정적 사이트(preview)로 띄운다. dev 서버는
    // 처음 보는 의존성을 최적화하며 쪽을 다시 불러오고, 서버 렌더가 멈춰도 쪽 타임아웃으로만 드러난다.
    // 빌드는 서버 렌더 오류를 빌드 실패로 낸다. 예제 스모크(test:examples)가 이 방식을 쓴다.
    // Astro 는 AI 에이전트 환경에서 dev·preview 서버를 스스로 백그라운드로 돌린다.
    // --ignore-lock 이면 포그라운드로 돌아 Playwright 가 수명을 관리한다.
    command:
      process.env.RNM_SITE === 'build'
        ? `pnpm --filter react-naver-maps run build && pnpm run build && pnpm preview --port ${PORT} --ignore-lock`
        : `pnpm dev --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}/react-naver-maps/`,
    cwd: '../../../website',
    // 빌드 모드는 지금 소스로 새로 빌드해야 하므로 떠 있는 서버를 쓰지 않는다.
    reuseExistingServer: process.env.RNM_SITE !== 'build',
    timeout: process.env.RNM_SITE === 'build' ? 600000 : 60000,
  },
  // 타일 로드 대기
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0,
      animations: 'disabled',
    },
  },
});
