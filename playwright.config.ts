import { defineConfig } from '@playwright/test';

/**
 * E2E against the exported web build. `npm run e2e` exports to dist/ first, then runs these tests.
 * Uses the locally installed Chrome (channel: 'chrome'), so no browser download is needed.
 */
const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    channel: 'chrome',
    headless: true,
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `node e2e/serve.mjs dist ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
