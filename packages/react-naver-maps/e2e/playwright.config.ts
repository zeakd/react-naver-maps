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
  testMatch: 'visual.spec.ts',
  timeout: 60000,
  snapshotPathTemplate: `${BASELINES}/{arg}{ext}`,
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1378, height: 900 },
  },
  webServer: {
    // Astro 는 AI 에이전트 환경에서 dev 서버를 스스로 백그라운드로 돌린다.
    // --ignore-lock 이면 포그라운드로 돌아 Playwright 가 수명을 관리한다.
    command: `pnpm dev --port ${PORT} --ignore-lock`,
    url: `http://localhost:${PORT}/react-naver-maps/`,
    cwd: '../../../website',
    reuseExistingServer: true,
    timeout: 60000,
  },
  // 타일 로드 대기
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0,
      animations: 'disabled',
    },
  },
});
