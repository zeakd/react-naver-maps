import { defineFixture } from '../fixture.js';
import { CustomControl } from '../target-imports.js';

export type CustomControlConfig = {
  /** CustomControl 을 이 자리(naver.maps.Position 값)에 버튼과 함께 올린다. */
  customControlPosition?: number;
};

export type CustomControlFrame = {
  /** CustomControl 이 들어 있는 컨트롤 자리(Position 값). 없으면 null */
  customControlAt: number | null;
  /** CustomControl element 안에 그려진 버튼 글자 */
  customControlText: string | null;
};

export const customControl = defineFixture<
  CustomControlConfig,
  { control: naver.maps.CustomControl | null },
  CustomControlFrame
>({
  probe: () => ({ control: null }),
  render: (config, probe) =>
    config.customControlPosition !== undefined && (
      <CustomControl
        ref={(o: naver.maps.CustomControl | null) => {
          if (o) probe.control = o;
        }}
        position={config.customControlPosition as naver.maps.Position}
      >
        <button type="button">처음 위치</button>
      </CustomControl>
    ),
  fields: { customControlAt: 'behavior', customControlText: 'behavior' },
  read: (map, probe) => ({
    customControlAt: (() => {
      const el = probe.control?.getElement();
      if (!el) return null;
      for (const [pos, arr] of Object.entries(map.controls ?? {})) {
        const items =
          (arr as { getArray?: () => unknown[] })?.getArray?.() ?? [];
        if (items.includes(el)) return Number(pos);
      }
      return null;
    })(),
    customControlText: probe.control?.getElement().textContent ?? null,
  }),
});
