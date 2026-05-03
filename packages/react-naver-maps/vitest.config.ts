import { defineConfig } from 'vitest/config';

// 항상 headless로 실행 (CI/로컬 공통). PWDEBUG/HEADED 환경 변수 등으로
// 의도치 않게 브라우저 GUI가 뜨는 일을 막기 위해 명시적으로 false로 잠금.
process.env.PWDEBUG = '0';
process.env.HEADED = '0';

export default defineConfig({
  test: {
    exclude: ['e2e/**', 'node_modules/**'],
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
            // GUI 띄우는 옵션 차단
            devtools: false,
          },
        },
      ],
    },
  },
});
