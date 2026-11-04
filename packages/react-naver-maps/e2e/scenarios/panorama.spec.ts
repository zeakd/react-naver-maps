import { expect, test } from '@playwright/test';

declare global {
  interface Window {
    mountPanorama: (
      host: HTMLElement,
      config: {
        position: [number, number];
        pan?: number;
        marker?: [number, number];
        infoWindow?: boolean;
      },
    ) => Promise<{
      events(): string[];
      pan(): number | null;
      setPan(n: number): void;
      markerOnPano(): boolean;
      infoWindowOnPano(): boolean;
    }>;
    pano: Awaited<ReturnType<Window['mountPanorama']>>;
  }
}

// 실제 panorama 서브모듈로 서울시청 앞 거리뷰를 연다(네트워크). 시계는 진짜로 둔다.
test('Panorama 는 거리뷰를 불러오고 pov prop 을 바꾸면 따른다', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await page.waitForFunction(() => window.mountPanorama !== undefined);
  await page.evaluate(async () => {
    window.pano = await window.mountPanorama(document.getElementById('host')!, {
      position: [37.5666, 126.9784],
      pan: 0,
    });
  });
  await page.waitForFunction(
    () => window.pano.events().some((e) => e.startsWith('pano_changed:')),
    undefined,
    { timeout: 20000 },
  );
  const events = await page.evaluate(() => window.pano.events());
  expect(events).toContain('pano_status:OK');
  expect(events.find((e) => e.startsWith('pano_changed:'))).not.toBe(
    'pano_changed:',
  );

  await page.evaluate(() => window.pano.setPan(90));
  await page.waitForFunction(
    () => Math.abs((window.pano.pan() ?? 0) - 90) < 1,
    undefined,
    {
      timeout: 5000,
    },
  );
  await page.waitForTimeout(1000);
  await testInfo.attach('panorama.png', {
    body: await page.screenshot({
      clip: { x: 0, y: 0, width: 600, height: 400 },
    }),
    contentType: 'image/png',
  });
});

test('Panorama 자식 Marker 와 InfoWindow 는 거리뷰가 준비된 뒤 거리뷰에 붙는다', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.waitForFunction(() => window.mountPanorama !== undefined);
  // 공식 튜토리얼 "파노라마에 정보 창" 의 자리(정자역 근처)와 마커.
  await page.evaluate(async () => {
    window.pano = await window.mountPanorama(document.getElementById('host')!, {
      position: [37.3599605, 127.1058814],
      pan: -135,
      marker: [37.359484, 127.105333],
      infoWindow: true,
    });
  });
  // 준비 전에는 붙이지 않는다.
  expect(await page.evaluate(() => window.pano.markerOnPano())).toBe(false);
  await page.waitForFunction(
    () => window.pano.events().includes('init'),
    undefined,
    {
      timeout: 20000,
    },
  );
  await page.waitForFunction(() => window.pano.markerOnPano(), undefined, {
    timeout: 5000,
  });
  await page.waitForFunction(() => window.pano.infoWindowOnPano(), undefined, {
    timeout: 5000,
  });
  const events = await page.evaluate(() => window.pano.events());
  expect(events.filter((e) => e === 'init')).toHaveLength(1);
  expect(events).toContain('infoWindowOpen');
  await page.waitForTimeout(1000);
  await testInfo.attach('panorama-marker.png', {
    body: await page.screenshot({
      clip: { x: 0, y: 0, width: 600, height: 400 },
    }),
    contentType: 'image/png',
  });
  expect(errors).toEqual([]);
});
