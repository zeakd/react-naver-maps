import { defineConfig } from '@playwright/test';

// 실제 SDK 로 지도 동작을 프레임 단위로 검증한다.
// Maps 키의 Web 서비스 URL 에 등록된 주소가 http://localhost:4321 이므로 포트를 바꾸지 않는다.
const PORT = 4321;

export default defineConfig({
  testDir: './scenarios',
  timeout: 60000,
  workers: 1,
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1024, height: 768 },
    video: 'retain-on-failure',
  },
  webServer: {
    command: `pnpm exec vite e2e/scenarios/page --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    cwd: '..',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
