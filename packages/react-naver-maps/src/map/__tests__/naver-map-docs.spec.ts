import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { MAP_STATIC_PROPS } from '../naver-map-options.js';

// 문서 사이트의 NaverMap 쪽이 적은 "생성 때만 적용" 목록이 MAP_OPTION_PROPS 의 'static' 과 같은지 본다.
// 표를 바꾸면 문서도 고친다(같은 PR 에서).
test('NaverMap 문서의 "생성 때만" 목록이 MAP_STATIC_PROPS 와 같다', () => {
  const mdx = readFileSync(
    resolve(
      import.meta.dirname,
      '../../../../../website/src/content/docs/api-references/naver-map.mdx',
    ),
    'utf8',
  );
  const line = mdx.split('\n').find((l) => l.includes('생성 때만 적용'));
  expect(line, '문서에 "생성 때만 적용" 줄이 없다').toBeDefined();
  // "`gl`, `customStyleId`, … 은 생성 때만 적용됩니다" 의 앞부분만 읽는다(뒤의 `key` 는 prop 이 아니다).
  const head = line!.slice(0, line!.indexOf('생성 때만 적용'));
  const listed = [...head.matchAll(/`(\w+)`/g)].map((m) => m[1]);
  expect(new Set(listed)).toEqual(new Set(MAP_STATIC_PROPS));
});
