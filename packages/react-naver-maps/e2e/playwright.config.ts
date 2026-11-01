import { defineConfig } from '@playwright/test';

// 문서 사이트 예제를 실제 네이버맵 SDK로 띄워 지도 영역을 스크린샷 비교한다.
//
// 예제는 Maps 키(ncpKeyId)를 쓰고, 이 키의 Web 서비스 URL 에 등록된 로컬 주소는
// http://localhost:4321 (Astro dev 기본 포트)이다. 다른 포트에서는 인증이 실패한다.
const PORT = 4321;

export default defineConfig({
  testDir: '.',
  timeout: 60000,
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1378, height: 900 },
  },
  webServer: {
    command: `pnpm dev --port ${PORT}`,
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
