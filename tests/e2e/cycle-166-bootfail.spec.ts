import { test, expect } from '@playwright/test';
import { boot, foundingState, BOOT_TIMEOUT } from './helpers';

/**
 * BACKLOG-553 — the boot that hangs, said out loud.
 *
 * This spec deliberately does **not** call `boot()`: `boot()` waits on `__ready`, and the thing under
 * test is precisely a boot that never sets it. Calling the helper here would wait out the full 30,000ms
 * ceiling to prove that waiting out the full ceiling is the bug.
 *
 * The failure is forced through `?bootfail=1` rather than a `window.__` hook, and that is not a
 * stylistic choice: **every dev hook in this scene is attached inside the body that would have failed.**
 * A hook cannot exist on a boot that never got that far, which is the same reason the harness's failure
 * record has to drain `pageerror` instead of asking the page nicely.
 */

type W = Record<string, any>;

test('a boot that throws says so, on screen, instead of showing a blank canvas', async ({ page }) => {
  await page.goto('/?bootfail=1');

  // Polled on the **message**, not on `!== null`. Before `create()` runs at all `__bootError` is
  // `undefined`, and `undefined` is not null — so a not-null poll passes instantly on a page that has
  // not started yet, and the read after it explodes. It did: green when the server was warm, red twice
  // in a row under the full suite's parallel load. `BOOT_TIMEOUT` because this wait *is* a boot wait and
  // has no business holding a budget of its own.
  await expect
    .poll(() => page.evaluate(() => (window as W).__bootError?.message ?? null), { timeout: BOOT_TIMEOUT })
    .toContain('BACKLOG-553');

  const err = await page.evaluate(() => (window as W).__bootError);
  expect(err.phase).toBe('create');

  // `__ready` keeps its exact meaning — hooks attached, scene built — because the whole suite leans on it.
  expect(await page.evaluate(() => (window as W).__ready)).not.toBe(true);

  // The player-facing half: the park's own chrome, not a console line and not an alert.
  const shown = await page.evaluate(() => (window as W).__bootFailureText ?? null);
  expect(shown).toContain('The bowl failed to open.');
  expect(shown).toContain('BACKLOG-553');
});

test('an ordinary boot is untouched — no error recorded, and the scene comes up', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  await foundingState(page, 'as-shipped');

  expect(await page.evaluate(() => (window as W).__bootError)).toBeNull();
  expect(await page.evaluate(() => (window as W).__ready)).toBe(true);
  expect(errors).toEqual([]);
});
