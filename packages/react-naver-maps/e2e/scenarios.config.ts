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
    // RNM_REACT_PROD=1 이면 시나리오 페이지를 배포 빌드(React production)로 묶어 preview 로 띄운다. 성능을
    // 사용자가 겪는 조건으로 재려는 것이다(개발 빌드는 요소마다 검사·스택 기록으로 몇 배 느리다). 개발 모드
    // 경고와 StrictMode 검사는 없어진다.
    command: process.env.RNM_REACT_PROD
      ? `pnpm exec vite build e2e/scenarios/page --config e2e/scenarios/vite.config.ts --outDir ../../.compare/scenario-build --emptyOutDir --minify false && pnpm exec vite preview e2e/scenarios/page --config e2e/scenarios/vite.config.ts --outDir ../../.compare/scenario-build --port ${PORT} --strictPort`
      : `pnpm exec vite e2e/scenarios/page --config e2e/scenarios/vite.config.ts --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    cwd: '..',
    // 비교 실행은 대상마다 서버를 새로 띄워야 한다. 남은 서버를 쓰면 다른 대상을 검사하게 된다.
    reuseExistingServer:
      !process.env.RNM_TARGET &&
      !process.env.RNM_COMPARE &&
      !process.env.RNM_REACT_PROD,
    timeout: process.env.RNM_REACT_PROD ? 180000 : 30000,
  },
});
