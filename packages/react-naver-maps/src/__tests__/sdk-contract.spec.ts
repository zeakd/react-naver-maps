import { afterEach, expect, test } from 'vitest';
import { sdkContract } from './sdk-contract.js';
import { installSdkFake, type SdkFake } from './sdk-fake.js';

// 같은 검사를 실제 SDK 에서도 돌린다(e2e/scenarios/sdk-contract.spec.ts).
let fake: SdkFake;
afterEach(() => fake.uninstall());

test('가짜 SDK 가 계약을 지킨다', () => {
  fake = installSdkFake();
  const results = sdkContract(
    fake.maps as unknown as typeof naver.maps,
    document.createElement('div'),
  );
  expect(results.filter((r) => r.error)).toEqual([]);
  expect(results.length).toBeGreaterThan(10);
});
