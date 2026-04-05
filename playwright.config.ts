import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config GP Parts — Phase 2 setup.
 * Doc : https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  // Timeout global par test
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  // Échec du run entier si un `test.only` traîne en CI
  forbidOnly: !!process.env.CI,
  // Retry automatique en CI pour absorber les flakes réseau
  retries: process.env.CI ? 2 : 0,
  // Parallélisme : 1 worker en CI pour limiter la charge, auto en local
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Démarre automatiquement `next dev` avant les tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
