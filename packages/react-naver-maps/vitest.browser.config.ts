import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// smoke.spec.tsx 전용 — 실제 naver maps SDK를 네트워크에서 로드하는 통합 테스트.
// real 브라우저(Playwright Chromium)가 필요하므로 CI 기본 test(happy-dom)에서 분리한다.
// 로컬/릴리스 검증 시 `pnpm test:browser`로 실행한다.
//
// 항상 headless로 실행. PWDEBUG/HEADED로 의도치 않게 GUI가 뜨는 것을 명시적으로 잠근다.
process.env.PWDEBUG = '0';
process.env.HEADED = '0';

export default defineConfig({
  test: {
    include: ['**/smoke.spec.tsx'],
    browser: {
      enabled: true,
      provider: playwright({ launchOptions: { headless: true, devtools: false } }),
      headless: true,
      // Maps 키의 Web 서비스 URL 에 등록된 로컬 주소(http://localhost:4321)와 맞춘다.
      // 포트가 바뀌면 인증이 실패하므로 strictPort 로 다른 포트로 넘어가지 않게 한다.
      api: {
        port: 4321,
        strictPort: true,
      },
      instances: [{ browser: 'chromium' }],
    },
  },
});
