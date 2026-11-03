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
    // GL 서브모듈은 성능 경고 없는 WebGL 에서만 GL 로 그린다. 기본 headless 는 소프트웨어 렌더라
    // 래스터로 떨어지므로 GPU 를 쓰게 한다. GPU 가 없는 환경에서는 효과가 없다.
    launchOptions: {
      args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'],
    },
  },
  webServer: {
    command: `pnpm exec vite e2e/scenarios/page --config e2e/scenarios/vite.config.ts --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    cwd: '..',
    // 비교 실행은 대상마다 서버를 새로 띄워야 한다. 남은 서버를 쓰면 다른 대상을 검사하게 된다.
    reuseExistingServer: !process.env.RNM_TARGET && !process.env.RNM_COMPARE,
    timeout: 30000,
  },
});
