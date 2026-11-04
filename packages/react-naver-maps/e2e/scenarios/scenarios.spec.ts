import { expect, test } from '@playwright/test';
import { version as reactVersion } from 'react';
import { createPlaywrightDriver, type Shot } from './playwright-driver.js';
import { runScenario, violations } from './run.js';
import { scenarios } from './scenarios.js';

// 비교 실행(`e2e/compare.ts`)이 기준선을 검사할 때 그 이름. 없으면 저장소 소스다.
// 배포 버전은 `0.3.0`, git 커밋은 `git-<sha7>` 이다.
const target = process.env.RNM_TARGET;

const [major = 0, minor = 0] = reactVersion.split('.').map(Number);
const hasActivity = major > 19 || (major === 19 && minor >= 2);

function olderThan(version: string, since: string) {
  // git 기준선은 since 를 따지지 않는다. 시나리오가 쓰는 API 가 없으면 그 시나리오가 실패로 드러난다.
  if (!/^\d+\.\d+/.test(version)) return false;
  const [a = 0, b = 0] = version.split('.').map(Number);
  const [c = 0, d = 0] = since.split('.').map(Number);
  return a < c || (a === c && b < d);
}

for (const scenario of scenarios) {
  test(scenario.name, async ({ page: defaultPage, browser }, testInfo) => {
    test.skip(
      !!target && !!scenario.since && olderThan(target, scenario.since),
      `${target} 에는 이 시나리오가 쓰는 API 가 없다 (since ${scenario.since})`,
    );
    // Activity 는 React 19.2 부터 있다(app/activity.tsx). 그 전 버전에서는 Activity 를 쓰는 시나리오를 건너뛴다.
    test.skip(
      !hasActivity && /Activity"/.test(JSON.stringify(scenario)),
      `React ${reactVersion} 에는 Activity 가 없다`,
    );
    if (scenario.knownIssue) test.fail(true, scenario.knownIssue);
    // 터치 시나리오는 터치를 지원하는 기기로 연다. 페이지를 연 뒤에는 바꿀 수 없다.
    const page = scenario.app.touch
      ? await (
          await browser.newContext({
            hasTouch: true,
            viewport: { width: 1024, height: 768 },
          })
        ).newPage()
      : defaultPage;
    const shots: Shot[] = [];
    // 앱이 던진 에러(렌더 중 예외 등)는 궤적이 맞아도 실패다.
    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));
    const trace = await runScenario(
      createPlaywrightDriver(page, shots),
      scenario,
    );
    await testInfo.attach('trace.json', {
      body: JSON.stringify(trace),
      contentType: 'application/json',
    });
    if (scenario.unstable) {
      await testInfo.attach('unstable.json', {
        body: JSON.stringify(scenario.unstable.fields),
        contentType: 'application/json',
      });
    }
    for (const shot of shots) {
      await testInfo.attach(
        shot.text ? `${shot.name}.txt` : `${shot.name}.png`,
        shot.text
          ? { body: shot.text, contentType: 'text/plain' }
          : { body: shot.png!, contentType: 'image/png' },
      );
    }
    // WebGL 을 성능 경고 없이 쓸 수 없는 환경(GPU 없는 CI)에서 SDK 는 래스터로 바꾼다.
    // 그때 gl 시나리오는 GL 을 검사하지 못하므로 건너뛴다.
    test.skip(
      !!scenario.app.gl && trace[0]?.renderMode !== 2,
      'WebGL 을 쓸 수 없어 SDK 가 래스터로 그렸다',
    );
    expect(pageErrors).toEqual([]);
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
