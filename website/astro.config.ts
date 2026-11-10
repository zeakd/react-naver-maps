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
          tsconfig: '../packages/react-naver-maps/tsconfig.json',
        },
      ],
    }),
  ],
  markdown: {
    // 코드 색은 밝은 화면·어두운 화면 두 벌(global.css 가 --shiki-light / --shiki-dark 를 고른다).
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false },
  },
  site: 'https://zeakd.github.io',
  base: '/react-naver-maps',
});
