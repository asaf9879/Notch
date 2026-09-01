import { defineConfig, devices } from '@playwright/test';

/**
 * BASE_URL should point at the Guardio staging/test environment, e.g.
 *   https://guardio.app.getnotch.dev
 * Set it via env var so credentials/environment never get hardcoded into the repo:
 *   BASE_URL=https://guardio.app.getnotch.dev GUARDIO_USER=... GUARDIO_PASS=... npm test
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://guardio.app.getnotch.dev',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
