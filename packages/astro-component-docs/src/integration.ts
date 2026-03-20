import type { AstroIntegration } from 'astro';
import type { AstroComponentDocsConfig } from './props/types.js';

export type {
  AstroComponentDocsConfig,
  PackageConfig,
  PropsOverride,
} from './props/types.js';

export default function astroComponentDocs(
  config: AstroComponentDocsConfig = {},
): AstroIntegration {
  return {
    name: 'astro-component-docs',
    hooks: {
      'astro:config:setup': async ({ updateConfig }) => {
        const { rehypeExample } = await import('./rehype/rehype-example.js');
        const { remarkLiveCode } = await import('./remark/remark-live-code.js');
        const { vitePluginProps } = await import('./vite/vite-plugin-props.js');

        updateConfig({
          markdown: {
            rehypePlugins: [rehypeExample],
            remarkPlugins: [remarkLiveCode],
          },
          vite: {
            plugins: [vitePluginProps(config)],
          },
        });
      },
    },
  };
}
