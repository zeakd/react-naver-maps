import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// RNM_TARGET 이 있으면 `e2e/.targets/<버전>/package` 에 풀어 둔 배포본을 검사한다.
// 배포본에는 0.4 에서 생긴 export(useAutoResize 등)가 없을 수 있다. 그 기능을 쓰는
// 시나리오는 `since` 로 표시해 건너뛴다(`scenarios.spec.ts`).
const target = process.env.RNM_TARGET;
const targetEntry = resolve(import.meta.dirname, 'target.ts');

export default defineConfig({
  plugins: target
    ? [
        {
          name: 'rnm-target',
          enforce: 'pre',
          async resolveId(source, importer) {
            const resolved = await this.resolve(source, importer, {
              skipSelf: true,
            });
            if (resolved?.id !== targetEntry) return null;
            const shim = resolve(
              import.meta.dirname,
              `../.targets/${target}/target.js`,
            );
            if (!existsSync(shim)) {
              throw new Error(
                `${shim} 가 없다. e2e/compare.ts 가 배포본을 풀어 둔다.`,
              );
            }
            return shim;
          },
        },
      ]
    : [],
});
