import type { Page } from '@playwright/test';
import type { MountedApp } from './app.js';
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

/**
 * 실제 Chromium 과 실제 SDK 로 시나리오를 실행한다.
 *
 * 가상 시계를 멈춰 두고 16ms 씩 직접 넘기므로 같은 시나리오는 같은 궤적을 낸다.
 * React 의 스케줄러는 MessageChannel 을 쓰고 가상 시계의 영향을 받지 않으므로,
 * 프레임마다 메시지를 한 번 왕복해 대기 중인 렌더가 끝난 뒤 값을 읽는다.
 */
export function createPlaywrightDriver(page: Page): ScenarioDriver {
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
  const input = async (send: () => Promise<void>) => {
    const before = await page.evaluate(
      () => (window as unknown as { __inputs: number }).__inputs,
    );
    await send();
    await page.waitForFunction(
      (n) => (window as unknown as { __inputs: number }).__inputs > n,
      before,
      { polling: 'raf' },
    );
    await flush();
  };

  return {
    async mount(app) {
      await page.addInitScript(() => {
        const w = window as unknown as { __inputs: number };
        w.__inputs = 0;
        for (const type of ['mousedown', 'mousemove', 'mouseup', 'wheel']) {
          window.addEventListener(type, () => (w.__inputs += 1), {
            capture: true,
          });
        }
      });
      await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
      await page.goto('/');
      await page.waitForFunction(() => window.mountApp !== undefined);
      await page.evaluate(async (config) => {
        window.app = await window.mountApp(
          document.getElementById('host')!,
          config,
        );
      }, app);
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
    async wheel(x, y, deltaY) {
      await input(() => page.mouse.move(x, y));
      await input(() => page.mouse.wheel(0, deltaY));
    },
  };
}
