import { use } from 'react';
import { defineFixture } from '../fixture.js';

export type SuspendConfig = {
  /** 값이 바뀌면 지도 안에서 200ms(가상 시계) 동안 suspend 하는 자식을 올린다. */
  suspendKey?: number;
};

const suspensions = new Map<number, Promise<void>>();

/** key 마다 한 번, 200ms(가상 시계) 동안 suspend 한다. */
function Suspender({ k }: { k: number }) {
  let p = suspensions.get(k);
  if (!p) {
    // 어느 드라이버에서든 페이지의 가상 시계를 타도록 window 의 타이머를 쓴다.
    p = new Promise<void>((resolve) => window.setTimeout(resolve, 200));
    suspensions.set(k, p);
  }
  use(p);
  return null;
}

export const suspend = defineFixture<SuspendConfig>({
  render: (config) =>
    config.suspendKey !== undefined && <Suspender k={config.suspendKey} />,
});
