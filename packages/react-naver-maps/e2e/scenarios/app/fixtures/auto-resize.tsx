import { defineFixture } from '../fixture.js';
import { useAutoResize, useMap } from '../target-imports.js';

export type AutoResizeConfig = {
  /** addons 의 useAutoResize 를 켠다. */
  autoResize?: boolean;
};

function AutoResize() {
  useAutoResize(useMap());
  return null;
}

export const autoResize = defineFixture<AutoResizeConfig>({
  render: (config) => config.autoResize && <AutoResize />,
});
