import { defineConfig } from 'vitest/config';

// 항상 headless로 실행 (CI/로컬 공통). PWDEBUG/HEADED 환경 변수 등으로
// 의도치 않게 브라우저 GUI가 뜨는 일을 막기 위해 명시적으로 false로 잠금.
process.env.PWDEBUG = '0';
process.env.HEADED = '0';

export default defineConfig({
  test: {
    exclude: ['e2e/**', 'node_modules/**'],
    // 타입 레벨 테스트(event-types.spec.ts의 expectTypeOf/toEqualTypeOf)를 실제로 평가한다.
    // 이게 없으면 expectTypeOf는 런타임 no-op이라 타입 회귀를 잡지 못한다.
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.test.json',
      include: ['**/event-types.spec.ts'],
    },
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
