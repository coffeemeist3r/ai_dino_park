// QA-only override — points to a pre-running dev server on 127.0.0.1:5174
// Used when the default IPv6-only vite server can't be reached on 127.0.0.1:5173.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'echo "server already running"',
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: true,
    timeout: 10_000,
  },
});
