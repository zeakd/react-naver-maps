import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 실제 SDK 를 쓰는 검증은 e2e/ 에 있고 Playwright 로 돈다.
    exclude: ['e2e/**', 'node_modules/**'],
    // 대부분의 테스트는 vi.mock으로 naver SDK를 mock하므로 real 브라우저가 불필요.
    // happy-dom으로 충분하고, CI에서 Playwright 설치(불안정·hang)를 제거할 수 있다.
    environment: 'happy-dom',
    // 타입 레벨 테스트(expectTypeOf/toEqualTypeOf) 실제 평가.
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.test.json',
      include: ['**/event-types.spec.ts', '**/navermaps-types.spec.ts'],
    },
  },
});
