import { expect, test, type Page } from '@playwright/test';

// 네이버맵 SDK 는 페이지에서 처음 만든 지도로 한 번 인증한다(/v3/auth JSONP). 실패하면 응답 처리 중
// 전역 navermap_authFailure 를 호출한다. 지도 DOM 은 인증 결과와 무관하게 생기므로 성공 신호로 쓸 수 없다.
// 2026-11 실측: 잘못된 키에서 /v3/auth 응답 뒤 약 1.1초에 콜백이 호출됐다.
const AUTH_GRACE_MS = 3000;

async function authResult(page: Page, ncpKeyId?: string) {
  await page.addInitScript(() => {
    Object.assign(window, {
      authFailed: false,
      navermap_authFailure: () => Object.assign(window, { authFailed: true }),
    });
  });
  await page.goto('/');
  await page.waitForFunction(() => window.mountApp !== undefined);
  const response = page.waitForResponse((r) => r.url().includes('/v3/auth'));
  await page.evaluate(async (key) => {
    window.app = await window.mountApp(document.getElementById('host')!, {
      mode: 'props',
      ncpKeyId: key,
    });
  }, ncpKeyId);
  await response;
  await page.waitForTimeout(AUTH_GRACE_MS);
  return page.evaluate(
    () => (window as unknown as { authFailed: boolean }).authFailed,
  );
}

test('Maps 키로 인증을 통과한다', async ({ page }) => {
  expect(await authResult(page)).toBe(false);
  expect(await page.evaluate(() => window.app.ready())).toBe(true);
});

test('잘못된 키는 인증 실패로 판정한다', async ({ page }) => {
  expect(await authResult(page, 'invalid-key')).toBe(true);
});

test('인증 실패 뒤 재렌더와 언마운트에서 앱이 터지지 않는다', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(() => {
    Object.assign(window, { navermap_authFailure: () => {} });
  });
  await page.goto('/');
  await page.waitForFunction(() => window.mountApp !== undefined);
  const response = page.waitForResponse((r) => r.url().includes('/v3/auth'));
  await page.evaluate(async () => {
    window.app = await window.mountApp(document.getElementById('host')!, {
      mode: 'props',
      ncpKeyId: 'invalid-key',
      marker: true,
    });
  });
  await response;
  // SDK 는 실패 처리 1초 뒤 naver.maps 를 null 로 만든다.
  await page.waitForFunction(() => window.naver?.maps === null, undefined, {
    timeout: 10000,
  });

  await page.evaluate(() => {
    window.app.setProps({ center: [37.57, 126.99], zoom: 12 });
    window.app.setProps({ marker: false });
  });
  await page.evaluate(() => window.app.unmount());
  await page.waitForTimeout(100);
  expect(errors).toEqual([]);
});
