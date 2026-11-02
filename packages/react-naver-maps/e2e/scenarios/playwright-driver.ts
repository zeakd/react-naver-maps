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
// 지도 초기화가 끝나고 타일이 자리 잡을 때까지 기다리는 시간. 실제 시간이다.
const SETTLE_REAL_MS = 1500;
const SETTLE_VIRTUAL_MS = 3000;

/**
 * 실제 Chromium 과 실제 SDK 로 시나리오를 실행한다.
 *
 * 가상 시계를 멈춰 두고 16ms 씩 직접 넘기므로 같은 시나리오는 같은 궤적을 낸다.
 * React 의 스케줄러는 MessageChannel 을 쓰고 가상 시계의 영향을 받지 않으므로,
 * 프레임마다 메시지를 한 번 왕복해 대기 중인 렌더가 끝난 뒤 값을 읽는다.
 */
export function createPlaywrightDriver(page: Page): ScenarioDriver {
  return {
    async mount(app) {
      await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
      await page.goto('/');
      await page.waitForFunction(() => window.mountApp !== undefined);
      await page.evaluate(async (config) => {
        window.app = await window.mountApp(
          document.getElementById('host')!,
          config,
        );
      }, app);
      await page.waitForFunction(() => window.app.ready());
      await page.waitForTimeout(SETTLE_REAL_MS);
      await page.clock.pauseAt(new Date('2026-01-01T01:00:00Z'));
      await page.clock.runFor(SETTLE_VIRTUAL_MS);
      await page.evaluate(() => window.app.resetObserved());
    },
    async setProps(props) {
      await page.evaluate((p) => window.app.setProps(p), props);
    },
    async frame(): Promise<TraceFrame> {
      await page.clock.runFor(FRAME_MS);
      await page.evaluate(
        () =>
          new Promise<void>((resolve) => {
            const channel = new MessageChannel();
            channel.port1.onmessage = () => resolve();
            channel.port2.postMessage(0);
          }),
      );
      return page.evaluate(() => window.app.read());
    },
    async call(method, args) {
      await page.evaluate(([m, a]) => window.app.call(m, a), [method, args] as [
        string,
        unknown[],
      ]);
    },
    async mouse(kind, x, y) {
      // up 앞에 같은 좌표로 move 를 보내면 SDK 가 속도를 0 으로 보아 관성이 사라진다.
      if (kind !== 'up') await page.mouse.move(x, y);
      if (kind !== 'move') await page.mouse[kind]();
    },
    async realtime(ms) {
      await page.waitForTimeout(ms);
    },
    async clickMarker() {
      // 지도 중앙의 Marker. 컨테이너 크기는 app.tsx 의 600x400.
      await page.mouse.click(300, 190);
    },
    async wheel(x, y, deltaY) {
      await page.mouse.move(x, y);
      await page.mouse.wheel(0, deltaY);
    },
  };
}
