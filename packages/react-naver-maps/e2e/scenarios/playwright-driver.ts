import type { CDPSession, Page } from '@playwright/test';
import type { MountedApp } from './app/index.js';
import type { AppConfig, ScenarioDriver, TraceFrame } from './types.js';

declare global {
  interface Window {
    mountApp: (host: HTMLElement, app: AppConfig) => Promise<MountedApp>;
    app: MountedApp;
  }
}

const FRAME_MS = 16;
// init 뒤 타일이 자리 잡을 때까지 기다리는 시간. 실제 시간이다.
const SETTLE_REAL_MS = 1500;
const SETTLE_VIRTUAL_MS = 3000;
const FLUSH_ROUNDS = 3;
// touch slop 으로 보내지 않는 touchmove 를 기다리는 실제 시간.
const TOUCH_MOVE_WAIT_MS = 100;

/** 시나리오가 찍은 화면. spec 이 결과에 붙인다. */
export type Shot = { name: string; png: Buffer };

/** 페이지가 받은 입력 이벤트 수. mount 가 심는다. */
type InputCounter = { __inputs: number; __onInput?: () => void };

/**
 * 실제 Chromium 과 실제 SDK 로 시나리오를 실행한다.
 *
 * 가상 시계를 멈춰 두고 16ms 씩 직접 넘기므로 같은 시나리오는 같은 궤적을 낸다.
 * React 의 스케줄러는 MessageChannel 을 쓰고 가상 시계의 영향을 받지 않으므로,
 * 입력과 prop 변경 뒤, 그리고 프레임마다 메시지를 왕복해 대기 중인 렌더가 끝난 뒤 값을 읽는다.
 */
export function createPlaywrightDriver(
  page: Page,
  shots: Shot[] = [],
): ScenarioDriver {
  let cdp: CDPSession | undefined;
  // 입력이 예약한 React 작업(MessageChannel)을 끝낸다. 입력 직후에 부르지 않으면 그 작업이
  // 시계를 넘기기 전에 도는지 뒤에 도는지가 실행마다 달라, SDK 가 미뤄 둔 이동이 들어가는
  // 프레임이 바뀐다(onCenterChanged 값을 가공해 되돌려주는 앱에서 관찰). 렌더가 지도 메서드를
  // 부르고 그 이벤트가 다시 렌더를 예약하는 사슬이 있어 여러 번 왕복한다.
  const flush = () =>
    page.evaluate(async (rounds) => {
      for (let i = 0; i < rounds; i++) {
        await new Promise<void>((resolve) => {
          const channel = new MessageChannel();
          channel.port1.addEventListener('message', () => resolve(), {
            once: true,
          });
          channel.port1.start();
          channel.port2.postMessage(0);
        });
      }
    }, FLUSH_ROUNDS);

  // Chrome 은 mousemove, wheel 을 실제 화면 프레임에 맞춰 늦게 전달한다. page.mouse 가 돌아와도
  // 페이지 JS 가 아직 이벤트를 받지 않았을 수 있어, 받을 때까지 기다린 뒤 flush 한다.
  //
  // 한 손가락 touchmove 는 처음 15px 안팎(touch slop)을 Chrome 이 페이지에 보내지 않는다.
  // 그래서 오지 않을 수 있는 이벤트는 실제 시간 maxWaitMs 까지만 기다린다.
  const input = async (send: () => Promise<void>, maxWaitMs?: number) => {
    const before = await page.evaluate(
      () => (window as unknown as InputCounter).__inputs,
    );
    await send();
    // 시계를 멈춰 두므로 rAF·타이머로 폴링하면 멈춘다. 입력 이벤트를 직접 기다린다.
    const arrived = page.evaluate(
      (n) =>
        new Promise<void>((resolve) => {
          const w = window as unknown as InputCounter;
          if (w.__inputs > n) return resolve();
          w.__onInput = () => {
            if (w.__inputs > n) resolve();
          };
        }),
      before,
    );
    await (maxWaitMs === undefined
      ? arrived
      : Promise.race([arrived, page.waitForTimeout(maxWaitMs)]));
    await flush();
  };

  return {
    async mount(app) {
      await page.addInitScript(() => {
        const w = window as unknown as InputCounter;
        w.__inputs = 0;
        for (const type of [
          'mousedown',
          'mousemove',
          'mouseup',
          'wheel',
          'touchstart',
          'touchmove',
          'touchend',
        ]) {
          window.addEventListener(
            type,
            () => {
              w.__inputs += 1;
              w.__onInput?.();
            },
            { capture: true },
          );
        }
      });
      if (app.touch) {
        // 터치 지원은 hasTouch 컨텍스트가 준다(scenarios.spec.ts). 손가락은 CDP 로 보낸다.
        cdp = await page.context().newCDPSession(page);
      }
      await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
      await page.goto('/');
      await page.waitForFunction(() => window.mountApp !== undefined);
      if (app.touch) {
        // 터치 지원이 없으면 SDK 는 마우스 경로를 탄다. 그러면 터치를 검사하지 못하므로 멈춘다.
        const touch = await page.evaluate(
          () => navigator.maxTouchPoints > 0 && 'ontouchstart' in window,
        );
        if (!touch) throw new Error('페이지가 터치 지원을 알리지 않는다');
      }
      // RNM_STRICT=1 이면 모든 시나리오를 StrictMode 로 올린다(effect 를 두 번 돌려도 같은 궤적인지 본다).
      const config = process.env.RNM_STRICT ? { ...app, strict: true } : app;
      await page.evaluate(async (c) => {
        window.app = await window.mountApp(document.getElementById('host')!, c);
      }, config);
      await page.waitForFunction(() => window.app.initialized());
      await page.waitForTimeout(SETTLE_REAL_MS);
      await page.clock.pauseAt(new Date('2026-01-01T01:00:00Z'));
      await page.clock.runFor(SETTLE_VIRTUAL_MS);
      await page.evaluate(() => window.app.resetObserved());
    },
    async setProps(props) {
      await page.evaluate((p) => window.app.setProps(p), props);
      await flush();
    },
    async frame(): Promise<TraceFrame> {
      await page.clock.runFor(FRAME_MS);
      await flush();
      return page.evaluate(() => window.app.read());
    },
    async call(method, args) {
      await page.evaluate(([m, a]) => window.app.call(m, a), [method, args] as [
        string,
        unknown[],
      ]);
      await flush();
    },
    async mouse(kind, x, y) {
      // up 앞에 같은 좌표로 move 를 보내면 SDK 가 속도를 0 으로 보아 관성이 사라진다.
      if (kind !== 'up') await input(() => page.mouse.move(x, y));
      if (kind !== 'move') await input(() => page.mouse[kind]());
    },
    async realtime(ms) {
      await page.waitForTimeout(ms);
    },
    async clickCenter() {
      // Marker 는 좌표 위쪽에 그려지므로 중앙보다 조금 위를 누른다. 컨테이너는 600x400.
      await page.mouse.click(300, 190);
      await flush();
    },
    async touch(kind, points) {
      if (!cdp) throw new Error('터치는 AppConfig.touch 가 있어야 한다');
      const type = (
        { start: 'touchStart', move: 'touchMove', end: 'touchEnd' } as const
      )[kind];
      await input(
        async () => {
          await cdp!.send('Input.dispatchTouchEvent', {
            type,
            touchPoints: points.map(([x, y], id) => ({ x, y, id })),
          });
        },
        kind === 'move' ? TOUCH_MOVE_WAIT_MS : undefined,
      );
    },
    async shot(name) {
      shots.push({ name, png: await page.screenshot() });
    },
    async probe() {
      // 지도(600x400, 화면 왼쪽 위) 가운데. 그림은 페이지의 canvas 로 풀어 센다(실제 시간).
      const png = await page.screenshot({
        clip: { x: 250, y: 150, width: 100, height: 100 },
      });
      return page.evaluate(async (b64) => {
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let red = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i]! > 200 && data[i + 1]! < 80 && data[i + 2]! < 80) red++;
        }
        return red;
      }, png.toString('base64'));
    },
    async wheel(x, y, deltaY) {
      await input(() => page.mouse.move(x, y));
      await input(() => page.mouse.wheel(0, deltaY));
    },
  };
}
