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
  // BACKLOG-486 (rework): put the world on seeded dice. Capping the workers and lifting the per-test budget
  // did not stop the one-victim-per-run pattern, and the failures were never timeouts — `cycle-129-berth`
  // fell by exactly one tile, a wander step that happened to go toward the food. A spec asserting over a
  // live coin flip cannot be re-run into information. Every spec boots on the same sequence.
  await page.evaluate(() => (window as Record<string, (s: number) => boolean>).__seedRandom?.(20260818));
  // BACKLOG-431: freeze the wall-clock ambient timers (wander/sky/migration rolls) for every spec, so the
  // background world tick can't mutate pinned state mid-assert. Specs drive beats via explicit hooks
  // (__stepWorld, __triggerSky, __migrate, __maybeBarter, __advanceWall), which bypass the pause. A spec
  // that genuinely needs the live timers calls __resumeAmbient() after boot.
  await page.evaluate(() => (window as Record<string, () => void>).__pauseAmbient?.());
}

/**
 * Gather the whole cast into the bowl (CHARTER v7).
 *
 * Before v7 the roster spawned entirely into the bowl, so "everyone is co-located and every other ground is
 * empty" was the free founding fixture, and a good many specs were written against it without ever saying
 * so. v7 ships residents on the grove and the Fernreach, which is the point — but a spec whose *subject* is
 * something else (a comfort visit, an inspection, a shared stargaze) still needs the cast in one place.
 *
 * This restores that fixture **explicitly**, so the assumption is visible in the spec that depends on it
 * rather than smuggled in from the roster. Specs whose subject genuinely *is* the founding state assert the
 * new distribution instead and must not call this.
 */
export async function gatherToBowl(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as Record<string, any>;
    for (const d of w.__dinoPositions() as Array<{ name: string }>) {
      if (w.__homeZone(d.name) !== 'bowl') w.__migrate(d.name, 'bowl');
    }
  });
}

/**
 * Restore the pre-v7 empty grounds (CHARTER v7 / BACKLOG-488).
 *
 * The founding park now ships a ruin in the Grove and the stone to raise it, so that the disrepair, upkeep
 * and mend systems are things a new player can watch rather than facts about a save file. That is the point
 * — but a good many specs used "every ground but the bowl is empty, and no pile has anything in it" as a
 * free fixture without ever saying so: a carry spec, a craft spec, a prosperity tier.
 *
 * This restores that fixture **explicitly**, the way `gatherToBowl` restores the co-located cast. A spec
 * whose subject genuinely *is* the founding state asserts the new one instead and must not call this.
 */
export async function emptyGrounds(page: Page): Promise<void> {
  await page.evaluate(() => (window as Record<string, () => number>).__clearFounding?.());
}

/**
 * Wait for the world to have processed an input (BACKLOG-515).
 *
 * `page.keyboard.press()` / `page.mouse.click()` resolve when CDP has **dispatched** the DOM event. Phaser's
 * `KeyboardPlugin` queues that event and emits `Key.on('down')` from the scene's own update step — see
 * `WorldScene.ts`'s `this.cursors.left.on('down', …)`. A `page.evaluate` on the next line of a spec is a
 * *second* round-trip, and it can land before that frame has run.
 *
 * Which is why the failures always looked backwards: a **fast** round-trip (serial run, warm dev server)
 * loses the race and a slow one (under parallel load) wins it by accident. Four specs have been catalogued
 * on this — `mobile-minds`, `cycle-044-sound`, `cycle-047-warmth`, `cycle-038-scan` — each diagnosed as its
 * own bug, none of them a bug in the game: a real player's ArrowLeft turns the page on the next frame,
 * sixteen milliseconds later, which is correct.
 *
 * Two frames, not one: the first drains the queue into the handler, the second lets the handler's effect be
 * true when the next `evaluate` reads it.
 *
 * **Use it only at a read-that-follows-an-input seam.** It is not a general-purpose sleep, and sprinkling it
 * through specs that already pass buys nothing but wall-clock.
 */
export async function settle(page: Page): Promise<void> {
  await page.evaluate(
    () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
  );
}
