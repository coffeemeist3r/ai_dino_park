import type { Page } from '@playwright/test';

/**
 * Boot the game and wait until the scene is fully ready.
 *
 * WorldScene.create() attaches all the `window.__*` dev hooks and then sets
 * `window.__ready = true` on its last line. Waiting on that flag (rather than
 * just the canvas being visible) removes the parallel-load flake where a spec
 * read a hook a frame before create() had attached it.
 */
export async function boot(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForFunction(() => (window as Record<string, unknown>).__ready === true, undefined, {
    timeout: 10_000,
  });
}
