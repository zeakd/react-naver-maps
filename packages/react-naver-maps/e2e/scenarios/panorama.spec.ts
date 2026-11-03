import { expect, test } from '@playwright/test';

declare global {
  interface Window {
    mountPanorama: (
      host: HTMLElement,
      config: { position: [number, number]; pan?: number },
    ) => Promise<{
      events(): string[];
      pan(): number | null;
      setPan(n: number): void;
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
