import type { Page } from '@playwright/test';

/**
 * Boot the game and wait until the scene is fully ready.
 *
 * WorldScene.create() attaches all the `window.__*` dev hooks and then sets
 * `window.__ready = true` on its last line. Waiting on that flag (rather than
 * just the canvas being visible) removes the parallel-load flake where a spec
 * read a hook a frame before create() had attached it.
 *
 * The 30s ceiling (was 10s) covers cold parallel boots: when several fresh
 * browsers hit a cold Vite dev server at once, Phaser parse + first-load
 * transforms genuinely take longer than 10s. The server-side fix (vite
 * optimizeDeps + warmup) shrinks that cost; this headroom absorbs the rest so
 * a slow-but-correct cold boot isn't reported as a failure.
 */
const BOOT_TIMEOUT = 30_000;

export async function boot(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('canvas').waitFor({ state: 'visible', timeout: BOOT_TIMEOUT });
  await page.waitForFunction(() => (window as Record<string, unknown>).__ready === true, undefined, {
    timeout: BOOT_TIMEOUT,
  });
}
