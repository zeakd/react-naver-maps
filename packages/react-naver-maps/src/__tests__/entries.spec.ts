import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

// 공개 진입점마다 @types/navermaps 보강(sdk/navermaps-augment.ts)을 끌어온다. 하위 경로만 가져오는
// 프로젝트에도 보강한 SDK 타입이 들어가야 한다. 빠지면 그 프로젝트에서 보강한 메서드·이벤트가 컴파일되지
// 않았다(2026-11-05 리뷰, react-naver-maps/drawing 만 가져온 경우).
const pkgDir = resolve(import.meta.dirname, '../..');
const exportsMap = JSON.parse(
  readFileSync(resolve(pkgDir, 'package.json'), 'utf8'),
).exports as Record<string, { types: string }>;

test.each(Object.entries(exportsMap))(
  '진입점 %s 가 SDK 타입 보강을 끌어온다',
  (_, e) => {
    const base = resolve(
      pkgDir,
      e.types.replace(/^\.\/dist\//, 'src/').replace(/\.d\.ts$/, ''),
    );
    const file = ['.ts', '.tsx']
      .map((x) => base + x)
      .find((p) => existsSync(p));
    expect(file, `${e.types} 의 소스가 없다`).toBeDefined();
    expect(readFileSync(file!, 'utf8')).toMatch(
      /export type \{\} from '\.\.?\/sdk\/navermaps-augment\.js'/,
    );
  },
);
