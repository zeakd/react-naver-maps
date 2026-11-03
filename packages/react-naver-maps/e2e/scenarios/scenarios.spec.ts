import { expect, test } from '@playwright/test';
import { createPlaywrightDriver } from './playwright-driver.js';
import { runScenario, violations } from './run.js';
import { scenarios } from './scenarios.js';

// 비교 실행(`e2e/compare.ts`)이 배포본을 검사할 때 그 버전. 없으면 저장소 소스다.
const target = process.env.RNM_TARGET;

function olderThan(version: string, since: string) {
  const [a = 0, b = 0] = version.split('.').map(Number);
  const [c = 0, d = 0] = since.split('.').map(Number);
  return a < c || (a === c && b < d);
}

for (const scenario of scenarios) {
  test(scenario.name, async ({ page }, testInfo) => {
    test.skip(
      !!target && !!scenario.since && olderThan(target, scenario.since),
      `${target} 에는 이 시나리오가 쓰는 API 가 없다 (since ${scenario.since})`,
    );
    if (scenario.knownIssue) test.fail(true, scenario.knownIssue);
    const trace = await runScenario(createPlaywrightDriver(page), scenario);
    await testInfo.attach('trace.json', {
      body: JSON.stringify(trace),
      contentType: 'application/json',
    });
    expect(violations(scenario, trace)).toEqual([]);
  });
}

test('같은 시나리오는 같은 궤적을 낸다', async ({ browser }) => {
  const scenario = scenarios.find((s) => s.name.startsWith('panTo 도중 목표'))!;
  const runs = [];
  for (let i = 0; i < 2; i++) {
    const page = await (await browser.newContext()).newPage();
    await page.setViewportSize({ width: 1024, height: 768 });
    runs.push(await runScenario(createPlaywrightDriver(page), scenario));
    await page.context().close();
  }
  expect(runs[0]).toEqual(runs[1]);
});
