import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import astroComponentDocs from 'astro-component-docs/integration';

export default defineConfig({
  integrations: [
    react(),
    mdx(),
    sitemap(),
    astroComponentDocs({
      packages: [
        {
          name: 'react-naver-maps',
          tsconfig: '../packages/react-naver-maps-v2/tsconfig.json',
        },
      ],
    }),
  ],
  site: 'https://zeakd.github.io',
  base: '/react-naver-maps',
});
