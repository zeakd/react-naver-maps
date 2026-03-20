import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['e2e/**', 'node_modules/**'],
    browser: {
      enabled: true,
      provider: 'playwright',
      api: {
        port: 3000,
      },
      instances: [{ browser: 'chromium', launch: { headless: true } }],
    },
  },
});
