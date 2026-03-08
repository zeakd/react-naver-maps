import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: 'playwright',
      api: {
        port: 3000,
      },
      instances: [{ browser: 'chromium' }],
    },
  },
});
