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
      provider: 'playwright',
      headless: true,
      api: {
        port: 3000,
      },
      instances: [
        {
          browser: 'chromium',
          launch: {
            headless: true,
            devtools: false,
          },
        },
      ],
    },
  },
});
