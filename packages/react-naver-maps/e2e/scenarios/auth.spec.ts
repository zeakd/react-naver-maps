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
  expect(await page.evaluate(() => window.app.authFailures())).toBe(0);
});

test('잘못된 키는 인증 실패로 판정하고 onAuthFailure 를 한 번 부른다', async ({
  page,
}) => {
  expect(await authResult(page, 'invalid-key')).toBe(true);
  // 페이지가 먼저 둔 전역 함수와 NavermapsProvider 의 onAuthFailure 가 함께 불린다.
  expect(await page.evaluate(() => window.app.authFailures())).toBe(1);
});

test('인증 실패 뒤 재렌더와 언마운트에서 앱이 터지지 않는다', async ({
  page,
}) => {
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
      infoWindow: true,
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
    // InfoWindow 의 content 는 옵션 동기화와 따로 맞춘다. 그 길도 SDK 가 죽은 뒤 부르면 안 된다.
    window.app.setProps({ infoWindowContent: 'after failure' });
  });
  await page.evaluate(() => window.app.unmount());
  await page.waitForTimeout(100);
  expect(errors).toEqual([]);
});

test('인증 실패 뒤 NaverMap 만 내려도 지도 element 가 빠진다', async ({
  page,
}) => {
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
    });
  });
  await response;
  await page.waitForFunction(() => window.naver?.maps === null, undefined, {
    timeout: 10000,
  });
  // Container 의 내부 div 와 지도마다 만드는 div 가 같은 모양이다. 지도 div 하나가 빠지는 것을 본다.
  const absoluteChildren = () =>
    page.evaluate(
      () =>
        [...document.querySelectorAll('#host div')].filter(
          (el) =>
            (el as HTMLElement).style.position === 'absolute' &&
            (el as HTMLElement).style.width === '100%' &&
            (el as HTMLElement).style.height === '100%',
        ).length,
    );
  const before = await absoluteChildren();
  await page.evaluate(() => window.app.setProps({ showMap: false }));
  await page.waitForTimeout(100);
  expect(await absoluteChildren()).toBe(before - 1);
  expect(errors).toEqual([]);
});
