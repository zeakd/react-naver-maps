import { expect, test } from '@playwright/test';
import { createPlaywrightDriver } from './playwright-driver.js';

// 실제 geocoder 서브모듈로 Maps 키의 Geocoding 을 부른다(네트워크). 응답 내용은 NAVER 데이터라
// 바뀔 수 있어 대표 주소 하나만 본다.
test('geocode 와 reverseGeocode 는 실제 서비스 응답을 돌려준다', async ({
  page,
}) => {
  await createPlaywrightDriver(page).mount({
    mode: 'props',
    submodules: ['geocoder'],
  });
  await page.clock.resume();
  const road = await page.evaluate(() => window.app.geocode('불정로 6'));
  expect(road).toContain('불정로 6');
  const name = await page.evaluate(() =>
    window.app.reverseGeocode(37.3595953, 127.1053971),
  );
  expect(name).toBe('불정로');
});

test('geocoder 서브모듈 없이 부르면 불러오는 법을 알려 준다', async ({
  page,
}) => {
  await createPlaywrightDriver(page).mount({ mode: 'props' });
  const message = await page.evaluate(() => window.app.geocode('불정로 6'));
  expect(message).toContain("submodules={['geocoder']}");
});
