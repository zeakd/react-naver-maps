import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // smoke.spec.tsx는 실제 naver maps SDK를 네트워크에서 로드하는 통합 테스트라
    // real 브라우저가 필요하다. happy-dom으로 대체 불가하므로 여기서 제외하고,
    // vitest.browser.config.ts로 분리해 `pnpm test:browser`로 실행한다.
    exclude: ['e2e/**', 'node_modules/**', '**/smoke.spec.tsx'],
    // 대부분의 테스트는 vi.mock으로 naver SDK를 mock하므로 real 브라우저가 불필요.
    // happy-dom으로 충분하고, CI에서 Playwright 설치(불안정·hang)를 제거할 수 있다.
    environment: 'happy-dom',
    // 타입 레벨 테스트(event-types.spec.ts의 expectTypeOf/toEqualTypeOf) 실제 평가.
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.test.json',
      include: ['**/event-types.spec.ts'],
    },
  },
});
