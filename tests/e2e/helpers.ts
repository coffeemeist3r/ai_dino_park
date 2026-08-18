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
 *
 * BACKLOG-486: this number must stay **strictly below** the per-test `timeout` in
 * `playwright.config.ts` (60s). While the two were equal, a boot that genuinely
 * needed 22s left the spec no budget at all, and the failure surfaced as whatever
 * assertion the clock landed on — a different victim every run, always green in
 * isolation. If you raise this ceiling, raise that timeout first.
 */
const BOOT_TIMEOUT = 30_000;

export async function boot(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('canvas').waitFor({ state: 'visible', timeout: BOOT_TIMEOUT });
  await page.waitForFunction(() => (window as Record<string, unknown>).__ready === true, undefined, {
    timeout: BOOT_TIMEOUT,
  });
  // BACKLOG-486: `__ready` is a flag create() sets on its last line — it says the hooks are attached, not
  // that the scene has drawn. Give it one frame, so a spec reads a world that has actually stepped once.
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => r())));
  // BACKLOG-431: freeze the wall-clock ambient timers (wander/sky/migration rolls) for every spec, so the
  // background world tick can't mutate pinned state mid-assert. Specs drive beats via explicit hooks
  // (__stepWorld, __triggerSky, __migrate, __maybeBarter, __advanceWall), which bypass the pause. A spec
  // that genuinely needs the live timers calls __resumeAmbient() after boot.
  await page.evaluate(() => (window as Record<string, () => void>).__pauseAmbient?.());
}
