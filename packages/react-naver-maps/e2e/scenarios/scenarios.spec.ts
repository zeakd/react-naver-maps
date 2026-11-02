import { expect, test } from '@playwright/test';
import { createPlaywrightDriver } from './playwright-driver.js';
import { runScenario, violations } from './run.js';
import { scenarios } from './scenarios.js';

for (const scenario of scenarios) {
  test(scenario.name, async ({ page }, testInfo) => {
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
