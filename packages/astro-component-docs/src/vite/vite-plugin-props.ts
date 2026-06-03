import type { AstroComponentDocsConfig, ComponentDoc } from '../props/types.js';
import { extractAllProps } from '../props/extractor.js';

const VIRTUAL_MODULE_ID = 'virtual:astro-component-docs/props';
const RESOLVED_ID = '\0' + VIRTUAL_MODULE_ID;

interface VitePlugin {
  name: string;
  resolveId?(id: string): string | undefined;
  load?(id: string): string | undefined;
  handleHotUpdate?(ctx: { file: string }): void;
}

export function vitePluginProps(config: AstroComponentDocsConfig): VitePlugin {
  let propsCache: Record<string, ComponentDoc> | null = null;

  function getPropsData(): Record<string, ComponentDoc> {
    if (propsCache) return propsCache;

    propsCache = {};
    for (const pkg of config.packages ?? []) {
      if (!pkg.tsconfig) continue;
      try {
        const docs = extractAllProps(pkg);
        for (const doc of docs) {
          propsCache[`${pkg.name}:${doc.displayName}`] = doc;
        }
      } catch (e) {
        console.warn(
          `[astro-component-docs] Failed to extract props for package "${pkg.name}":`,
          e,
        );
      }
    }
    return propsCache;
  }

  return {
    name: 'astro-component-docs:props',

    resolveId(id: string) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_ID;
    },

    load(id: string) {
      if (id !== RESOLVED_ID) return;

      const data = getPropsData();
      return `export const propsData = ${JSON.stringify(data)};`;
    },

    handleHotUpdate({ file }: { file: string }) {
      if (
        file.endsWith('tsconfig.json') ||
        file.endsWith('.d.ts') ||
        file.endsWith('.ts') ||
        file.endsWith('.tsx')
      ) {
        propsCache = null;
      }
    },
  };
}
