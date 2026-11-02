import { expect, test } from '@playwright/test';

// SDK 는 window load 시점에 onJSContentLoaded 가 등록돼 있어야만 jsContentLoaded 를 켠다.
// 페이지가 maps.js 를 직접 넣고 load 뒤에 라이브러리가 올라오면 콜백이 다시 오지 않는다.
test('페이지가 먼저 넣은 maps.js 를 load 뒤에 마운트해도 지도가 뜬다', async ({
  page,
}) => {
  await page.goto('/preloaded.html', { waitUntil: 'load' });
  await page.waitForFunction(() => window.mountApp !== undefined);
  await page.evaluate(async () => {
    window.app = await Promise.race([
      window.mountApp(document.getElementById('host')!, { mode: 'props' }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('loadScript 가 끝나지 않는다')),
          5000,
        ),
      ),
    ]);
  });
  await page.waitForFunction(() => window.app.ready());
  expect(await page.evaluate(() => window.app.ready())).toBe(true);
});
