import { expect, test } from '@playwright/test';

// 라이브러리가 이름으로 받는 SDK 상수(src/core/constants.ts)의 이름이 @types 와 실제 SDK 에 모두 있는지 본다.
// 아래 표는 @types/navermaps 의 enum 이름 전부다. @types 가 이름을 더하거나 빼면 Record 의 키가 맞지 않아
// 타입 검사(pnpm check:e2e)가 실패한다. 실제 SDK 객체에 없는 이름은 이 spec 이 실패로 낸다.
// SDK 를 바꾼 뒤(sdk/README.md 갱신 절차) 이 spec 이 어긋남을 알려 준다.
const TABLES = {
  Position: {
    CENTER: true,
    TOP_LEFT: true,
    TOP_CENTER: true,
    TOP_RIGHT: true,
    LEFT_CENTER: true,
    LEFT_TOP: true,
    LEFT_BOTTOM: true,
    RIGHT_TOP: true,
    RIGHT_CENTER: true,
    RIGHT_BOTTOM: true,
    BOTTOM_LEFT: true,
    BOTTOM_CENTER: true,
    BOTTOM_RIGHT: true,
  } satisfies Record<keyof typeof naver.maps.Position, true>,
  Animation: { BOUNCE: true, DROP: true } satisfies Record<
    keyof typeof naver.maps.Animation,
    true
  >,
  ZoomControlStyle: { LARGE: true, SMALL: true } satisfies Record<
    keyof typeof naver.maps.ZoomControlStyle,
    true
  >,
  MapTypeControlStyle: { BUTTON: true, DROPDOWN: true } satisfies Record<
    keyof typeof naver.maps.MapTypeControlStyle,
    true
  >,
  'drawing.DrawingMode': {
    HAND: true,
    RECTANGLE: true,
    ELLIPSE: true,
    POLYLINE: true,
    ARROWLINE: true,
    POLYGON: true,
    MARKER: true,
  } satisfies Record<keyof typeof naver.maps.drawing.DrawingMode, true>,
  'drawing.DrawingStyle': {
    HORIZONTAL: true,
    VERTICAL: true,
    HORIZONTAL_2: true,
    VERTICAL_2: true,
  } satisfies Record<keyof typeof naver.maps.drawing.DrawingStyle, true>,
};

test('이름으로 받는 SDK 상수의 이름이 실제 SDK 에 모두 있다', async ({
  page,
}) => {
  await page.goto('/');
  await page.waitForFunction(
    () => (window as unknown as { mountApp?: unknown }).mountApp !== undefined,
  );
  const names = Object.fromEntries(
    Object.entries(TABLES).map(([table, keys]) => [table, Object.keys(keys)]),
  );
  const missing = await page.evaluate(async (tables) => {
    const w = window as unknown as {
      mountApp: (h: HTMLElement, c: object) => Promise<unknown>;
      naver: { maps: Record<string, unknown> };
    };
    await w.mountApp(document.getElementById('host')!, {
      mode: 'props',
      submodules: ['drawing'],
    });
    const out: string[] = [];
    for (const [path, keys] of Object.entries(tables)) {
      const table = path
        .split('.')
        .reduce<unknown>(
          (o, k) => (o as Record<string, unknown> | undefined)?.[k],
          w.naver.maps,
        ) as Record<string, unknown> | undefined;
      for (const key of keys) {
        if (!table || !(key in table)) out.push(`${path}.${key}`);
      }
    }
    return out;
  }, names);
  expect(missing).toEqual([]);
});
