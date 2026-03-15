import { test, expect } from '@playwright/test';
import { setupTileCache } from './tile-cache';

const TILE_LOAD_TIMEOUT = 5000;

const examples = [
  // 기본 예제
  { name: 'marker', path: '/react-naver-maps/docs/examples/marker/' },
  { name: 'circle', path: '/react-naver-maps/docs/examples/circle/' },
  { name: 'shapes', path: '/react-naver-maps/docs/examples/shapes/' },
  { name: 'info-window', path: '/react-naver-maps/docs/examples/info-window/' },
  {
    name: 'custom-overlay',
    path: '/react-naver-maps/docs/examples/custom-overlay/',
  },
  // 공식 튜토리얼 매핑
  { name: 'map-options', path: '/react-naver-maps/docs/examples/map-options/' },
  { name: 'map-types', path: '/react-naver-maps/docs/examples/map-types/' },
  { name: 'map-bounds', path: '/react-naver-maps/docs/examples/map-bounds/' },
  { name: 'map-moves', path: '/react-naver-maps/docs/examples/map-moves/' },
  {
    name: 'map-geolocation',
    path: '/react-naver-maps/docs/examples/map-geolocation/',
  },
  {
    name: 'custom-control',
    path: '/react-naver-maps/docs/examples/custom-control/',
  },
  {
    name: 'marker-cluster',
    path: '/react-naver-maps/docs/examples/marker-cluster/',
  },
];

for (const { name, path: pagePath } of examples) {
  test(name, async ({ page }) => {
    await setupTileCache(page);
    await page.goto(pagePath);

    // React hydration + 네이버맵 로드 대기
    await page.locator('img[alt="NAVER"]').first().waitFor({ timeout: 30000 });
    await page.waitForTimeout(TILE_LOAD_TIMEOUT);

    // 지도 컨테이너 (astro-island 내부)
    const map = page.locator('astro-island > div > div').first();
    await expect(map).toBeVisible();
    await expect(map).toHaveScreenshot(`${name}.png`);
  });
}
