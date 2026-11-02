import { test, expect } from '@playwright/test';
import { setupTileCache } from './tile-cache.js';

const TILE_LOAD_TIMEOUT = 5000;

// name 은 스크린샷 파일 이름(__screenshots__/{name}.png), slug 는 website/src/content/docs/examples/{slug}.mdx
const examples = [
  // 기본 예제
  { name: 'marker', slug: 'marker-tutorial-1-simple' },
  { name: 'circle', slug: 'circle' },
  { name: 'shapes', slug: 'shapes' },
  { name: 'info-window', slug: 'info-window' },
  { name: 'custom-overlay', slug: 'custom-overlay' },
  // 공식 튜토리얼 매핑
  { name: 'map-options', slug: 'map-tutorial-2-options' },
  { name: 'map-types', slug: 'map-tutorial-3-types' },
  { name: 'map-bounds', slug: 'map-tutorial-4-bounds' },
  { name: 'map-moves', slug: 'map-tutorial-5-moves' },
  { name: 'map-geolocation', slug: 'map-tutorial-6-geolocation' },
  { name: 'custom-control', slug: 'control-tutorial-4-custom-p1' },
  { name: 'marker-cluster', slug: 'marker-cluster-tutorial' },
];

for (const { name, slug } of examples) {
  test(name, async ({ page }) => {
    await setupTileCache(page);
    await page.goto(`/react-naver-maps/examples/${slug}/`);

    // React hydration + 네이버맵 로드 대기
    await page.locator('img[alt="NAVER"]').first().waitFor({ timeout: 30000 });
    await page.waitForTimeout(TILE_LOAD_TIMEOUT);

    // 지도 컨테이너 (astro-island 내부)
    const map = page.locator('astro-island > div > div').first();
    await expect(map).toBeVisible();
    await expect(map).toHaveScreenshot(`${name}.png`);
  });
}
