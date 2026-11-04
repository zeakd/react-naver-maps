import { expect, test } from '@playwright/test';

declare global {
  interface Window {
    mountPanorama: (
      host: HTMLElement,
      config: {
        position: [number, number];
        pan?: number;
        marker?: [number, number];
        infoWindow?: boolean;
        roundPanTo?: number;
        povDelayMs?: number;
      },
    ) => Promise<{
      events(): string[];
      pan(): number | null;
      setPan(n: number): void;
      setPovCalls(): number[];
      markerOnPano(): boolean;
      infoWindowOnPano(): boolean;
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

test('Panorama 자식 Marker 와 InfoWindow 는 거리뷰가 준비된 뒤 거리뷰에 붙는다', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.waitForFunction(() => window.mountPanorama !== undefined);
  // 공식 튜토리얼 "파노라마에 정보 창" 의 자리(정자역 근처)와 마커.
  await page.evaluate(async () => {
    window.pano = await window.mountPanorama(document.getElementById('host')!, {
      position: [37.3599605, 127.1058814],
      pan: -135,
      marker: [37.359484, 127.105333],
      infoWindow: true,
    });
  });
  // 준비 전에는 붙이지 않는다.
  expect(await page.evaluate(() => window.pano.markerOnPano())).toBe(false);
  await page.waitForFunction(
    () => window.pano.events().includes('init'),
    undefined,
    {
      timeout: 20000,
    },
  );
  await page.waitForFunction(() => window.pano.markerOnPano(), undefined, {
    timeout: 5000,
  });
  await page.waitForFunction(() => window.pano.infoWindowOnPano(), undefined, {
    timeout: 5000,
  });
  const events = await page.evaluate(() => window.pano.events());
  expect(events.filter((e) => e === 'init')).toHaveLength(1);
  expect(events).toContain('infoWindowOpen');
  await page.waitForTimeout(1000);
  await testInfo.attach('panorama-marker.png', {
    body: await page.screenshot({
      clip: { x: 0, y: 0, width: 600, height: 400 },
    }),
    contentType: 'image/png',
  });
  expect(errors).toEqual([]);
});

/** 거리뷰 가운데를 잡고 dx 만큼 끈다. 끄는 동안 pan 과 setPov 호출을 모은다. */
async function dragPanorama(
  page: import('@playwright/test').Page,
  dx: number,
  settleMs = 1500,
) {
  const box = (await page.locator('#host').boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  const during: { pan: number | null; calls: number }[] = [];
  for (let i = 1; i <= 20; i++) {
    await page.mouse.move(x + (dx * i) / 20, y);
    await page.waitForTimeout(30);
    during.push(
      await page.evaluate(() => ({
        pan: window.pano.pan(),
        calls: window.pano.setPovCalls().length,
      })),
    );
  }
  await page.mouse.up();
  await page.waitForTimeout(settleMs);
  return during;
}

async function openPanorama(
  page: import('@playwright/test').Page,
  roundPanTo?: number,
  povDelayMs?: number,
) {
  await page.goto('/');
  await page.waitForFunction(() => window.mountPanorama !== undefined);
  await page.evaluate(
    async ([unit, delay]) => {
      window.pano = await window.mountPanorama(
        document.getElementById('host')!,
        {
          position: [37.5666, 126.9784],
          pan: 0,
          roundPanTo: unit,
          povDelayMs: delay,
        },
      );
    },
    [roundPanTo, povDelayMs] as const,
  );
  await page.waitForFunction(
    () => window.pano.events().includes('init'),
    undefined,
    {
      timeout: 20000,
    },
  );
  await page.waitForTimeout(1000);
}

// 대조군: 앱이 pov 를 되돌려주지 않으면 사용자 드래그 동안 라이브러리는 setPov 를 부르지 않는다.
test('Panorama 를 끌면 pan 이 바뀌고 라이브러리는 setPov 를 부르지 않는다', async ({
  page,
}) => {
  await openPanorama(page);
  const before = await page.evaluate(() => window.pano.pan());
  const during = await dragPanorama(page, -200);
  const after = await page.evaluate(() => window.pano.pan());
  expect(Math.abs((after ?? 0) - (before ?? 0))).toBeGreaterThan(5);
  expect(during.at(-1)!.calls).toBe(0);
  expect(await page.evaluate(() => window.pano.setPovCalls())).toEqual([]);
});

// 앱이 onPovChanged 의 pan 을 반올림해 pov 로 되돌려줘도 끄는 동안 당기지 않는다. 거리뷰는 끄는 동안
// pov 를 확정하지 않고(getPov 가 그대로, pov_changed 없음) 놓은 뒤 한 번 확정한다(3.10.5 실측,
// 2026-11-04). 그래서 한 번 끄는 동안에는 당길 일이 없다. 놓은 뒤에는 되돌려준 값으로 맞춘다. 앞선 끌기의
// 값이 늦게 와서 다음 끌기와 겹치는 경우는 누르는 동안의 보류가 막는다(아래 "pov 를 늦게 되돌려줘도").
test('반올림한 pov 를 되돌려줘도 Panorama 를 끄는 동안 setPov 를 부르지 않고 놓은 뒤 그 값으로 맞춘다', async ({
  page,
}) => {
  await openPanorama(page, 10);
  const during = await dragPanorama(page, -200);
  expect(during.every((d) => d.pan === 0 && d.calls === 0)).toBe(true);
  const calls = await page.evaluate(() => window.pano.setPovCalls());
  const after = await page.evaluate(() => window.pano.pan());
  expect(calls).toHaveLength(1);
  expect(calls[0]! % 10).toBe(0);
  expect(calls[0]).not.toBe(0);
  expect(after).toBe(calls[0]);
});

// QC 사례 24. 놓은 뒤 pov 를 늦게 되돌려주는 앱(300ms)에서, 놓자마자 다시 끌면 늦은 pov 가 두 번째 끄는
// 동안(약 600ms) 도착한다. 그때 라이브러리가 setPov 를 부르면 손 밑의 거리뷰를 당긴다. 첫 번째 놓음이
// 만든 setPov 는 지연 때문에 아직 불리지 않았으므로 두 번째 끄는 동안 setPov 는 0 이어야 한다.
// 늦은 값은 두 번째 끌기가 끝난 뒤 맞춘다(마지막 두 단언. 맞추는 시점은 확인하지 못했다).
test('pov 를 늦게 되돌려줘도 놓은 직후 다시 끄는 동안 Panorama 에 setPov 를 부르지 않는다', async ({
  page,
}) => {
  await openPanorama(page, 10, 300);
  await dragPanorama(page, -200, 0);
  const during = await dragPanorama(page, -200);
  expect(during.every((d) => d.calls === 0)).toBe(true);
  const calls = await page.evaluate(() => window.pano.setPovCalls());
  expect(calls.length).toBeGreaterThan(0);
  expect(calls.every((pan) => pan % 10 === 0)).toBe(true);
});
