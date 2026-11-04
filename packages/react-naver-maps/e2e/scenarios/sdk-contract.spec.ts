import { expect, test } from '@playwright/test';
import type { sdkContract } from '../../src/__tests__/sdk-contract.js';

declare global {
  interface Window {
    sdkContract: typeof sdkContract;
  }
}

// 단위 테스트의 가짜 SDK(src/__tests__/sdk-fake.ts)가 기대는 성질을 실제 SDK 에서 확인한다.
// 같은 검사(src/__tests__/sdk-contract.ts)가 가짜에서도 돈다(sdk-contract.spec.ts).
test('실제 SDK 가 단위 테스트 가짜의 계약을 지킨다', async ({ page }) => {
  await page.goto('/preloaded.html', { waitUntil: 'load' });
  await page.waitForFunction(
    () => window.sdkContract !== undefined && window.naver?.maps?.Map,
  );
  const results = await page.evaluate(() => {
    const el = document.createElement('div');
    el.style.cssText = 'width: 400px; height: 300px';
    document.body.appendChild(el);
    return window.sdkContract(naver.maps, el);
  });
  expect(results.filter((r) => r.error)).toEqual([]);
  expect(results.length).toBeGreaterThan(10);
});
