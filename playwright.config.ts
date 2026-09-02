import { defineConfig, devices } from '@playwright/test';

/**
 * BACKLOG-486 — the run, not the spec.
 *
 * For three cycles the suite lost exactly one spec per full run and passed that spec 5/5 in isolation, a
 * different victim each time and never one near the cycle's diff. Two facts made that inevitable:
 *
 * 1. `workers` was never set, so Playwright took half the machine's cores — six fresh Chromium instances on
 *    this box, all cold-booting Phaser against a single Vite dev server. `E2E_WORKERS` overrides the cap so a
 *    slower or faster machine can be recalibrated without editing this file.
 * 2. The per-test budget was Playwright's default 30s — *exactly* `helpers.ts`'s boot ceiling. A boot that
 *    legitimately took 22s under that load therefore could not be reported as a slow boot; it was reported as
 *    whichever assertion the spec happened to be on when the clock ran out. That is the whole "random victim"
 *    shape. The invariant restored here: **`timeout` must stay strictly greater than `BOOT_TIMEOUT`**, with
 *    real headroom for the spec's own work after the scene is up.
 *
 * No retries, no `test.slow()`, no skips: those make the suite green by hiding the signal it exists to give.
 */
// Default 2, not 4. Four workers is four Chromium process *trees* — on this box that pegged the CPU at 96%
// and made the machine unpleasant to use while a suite ran, which is a real cost the suite was quietly
// charging its operator. Two is slower in wall-clock and leaves the box usable. Raise it in CI, or locally
// with `E2E_WORKERS=4`, when nobody is sitting in front of the machine.
const WORKERS = Number(process.env.E2E_WORKERS) || 2;

export default defineConfig({
  testDir: './tests/e2e',
  // BACKLOG-515 (second cause): warm Vite's transform graph once, before any worker opens a browser, so a
  // cold boot is never charged to whichever spec happens to go first. `webServer.url` below waits for the
  // socket, not for the server to have transformed anything.
  globalSetup: './tests/e2e/globalSetup.ts',
  fullyParallel: true,
  workers: WORKERS,
  timeout: 60_000, // > helpers.ts BOOT_TIMEOUT (30s), so a slow-but-correct boot still has room to assert
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm --prefix game run dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
