/**
 * 네이버맵 타일 캐싱 fixture.
 *
 * 타일 서버 응답을 디스크에 저장하고, 이후 실행에서 캐시에서 서빙한다.
 * 동일 타일 = 동일 픽셀 → 100% 재현 가능한 시각 회귀 테스트.
 *
 * 사용법:
 *   TILE_CACHE=update  → 캐시 갱신 (새 타일 저장)
 *   TILE_CACHE=use     → 캐시 사용 (캐시 없으면 네트워크 fallback)
 *   (미설정)            → 캐싱 비활성화 (직접 네트워크)
 */
import type { Page, Route } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
const CACHE_DIR = path.join(import.meta.dirname, '__tile_cache__');
const TILE_URL_PATTERNS = [
  /nrbe\.pstatic\.net/,
  /map\.pstatic\.net/,
  /nmap-tileimage/,
  /map-tileimage/,
];

function urlToKey(url: string): string {
  return crypto.createHash('md5').update(url).digest('hex');
}

function isTileRequest(url: string): boolean {
  return TILE_URL_PATTERNS.some((p) => p.test(url));
}

export async function setupTileCache(page: Page): Promise<void> {
  const mode = process.env.TILE_CACHE;
  if (!mode) return;

  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  await page.route('**/*', async (route: Route) => {
    const url = route.request().url();

    if (!isTileRequest(url)) {
      await route.continue();
      return;
    }

    const key = urlToKey(url);
    const cachePath = path.join(CACHE_DIR, `${key}.bin`);
    const metaPath = path.join(CACHE_DIR, `${key}.json`);

    if (mode === 'use' && fs.existsSync(cachePath) && fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      await route.fulfill({
        status: meta.status,
        headers: meta.headers,
        body: fs.readFileSync(cachePath),
      });
      return;
    }

    const response = await route.fetch();
    const body = await response.body();

    if (mode === 'update' && body) {
      fs.writeFileSync(cachePath, body);
      fs.writeFileSync(
        metaPath,
        JSON.stringify({
          url,
          status: response.status(),
          headers: response.headers(),
        }),
      );
    }

    await route.fulfill({ response });
  });
}
