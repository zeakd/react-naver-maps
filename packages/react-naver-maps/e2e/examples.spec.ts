import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

// 문서 사이트의 모든 예제 쪽을 실제 SDK 로 열어 에러 없이 지도(또는 거리뷰)가 뜨는지 본다.
// 화면 비교는 visual.spec.ts 가 고른 예제만 한다. 이 검사는 예제가 늘어도 손대지 않는다.
const EXAMPLES_DIR = fileURLToPath(
  new URL('../../../website/src/content/docs/examples/', import.meta.url),
);
const slugs = readdirSync(EXAMPLES_DIR)
  .filter((f) => f.endsWith('.mdx'))
  .map((f) => f.replace(/\.mdx$/, ''))
  .toSorted();

for (const slug of slugs) {
  test(slug, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(`console: ${m.text()}`);
    });
    await page.goto(`/react-naver-maps/examples/${slug}/`);
    // 지도와 거리뷰는 오른쪽 아래에 NAVER 로고를 그린다. SDK 가 그리기 시작했다는 표시다.
    await expect(page.locator('img[alt="NAVER"]').first()).toBeAttached({
      timeout: 30000,
    });
    await page.waitForTimeout(1500);
    // 로고 이미지·타일 같은 네트워크 실패는 예제 결함이 아니라서 뺀다.
    expect(errors.filter((e) => !/Failed to load resource/.test(e))).toEqual(
      [],
    );
  });
}
