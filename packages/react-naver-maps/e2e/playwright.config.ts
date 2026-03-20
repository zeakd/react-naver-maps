import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 60000,
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  use: {
    baseURL: 'http://localhost:3000/react-naver-maps',
    viewport: { width: 1378, height: 900 },
  },
  // website-2 dev 서버가 localhost:3000에서 실행 중이어야 한다
  // 시작: pnpm --filter website-2 dev --port 3000
  webServer: {
    command: 'pnpm dev --port 3000',
    port: 3000,
    cwd: '../../website-2',
    reuseExistingServer: true,
    timeout: 30000,
  },
  // 타일 로드 대기
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0,
      animations: 'disabled',
    },
  },
});
