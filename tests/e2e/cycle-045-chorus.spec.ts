import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Dawn chorus (BACKLOG-192). The order is computed by the pure chorus.ts (pinned in unit
 * tests); this proves the live-only seam: a real onHour crossing into hour 7 fires the
 * chorus once per in-game day, a restore-style clock set is silent, and mute keeps the
 * order computable while playing nothing. Staged with the cycle-040 __setClock/__advanceWall
 * harness — __setClock is a restore sync (no beat), __advanceWall ticks listeners live.
 */

type W = Window & Record<string, any>;

const dawnCount = (p: Page) => p.evaluate(() => (window as W).__dawnCount());
const lastChorus = (p: Page) =>
  p.evaluate(() => (window as W).__lastChorus() as { name: string; delayMs: number }[] | null);
const chorusNow = (p: Page) =>
  p.evaluate(() => (window as W).__chorusOrder() as { name: string; delayMs: number }[]);
const setClock = (p: Page, d: number, h: number, m: number) =>
  p.evaluate(({ d, h, m }) => (window as W).__setClock(d, h, m), { d, h, m });
const advanceWall = (p: Page, ms: number) => p.evaluate((x) => (window as W).__advanceWall(x), ms);
const events = (p: Page) => p.evaluate(() => (window as W).__events() as string[]);

/**
 * Wall ms that advances the in-game clock by `mins` in-game minutes, **at whatever rate the clock is
 * actually running**. BACKLOG-493 made the default 60×, and every constant below used to be raw wall ms
 * computed against 1× — at 60× the same numbers advance sixty times as far, sail past the clock's
 * per-update catch-up cap, and jump via `set()` without firing a single `onHour`. Expressing the intent
 * ("twelve in-game hours") instead of the wall time is what makes these cases rate-proof.
 */
const wallMsFor = async (p: Page, mins: number) =>
  (mins * 60_000) / (await p.evaluate(() => (window as W).__clockScale() as number));

/** 12 in-game hours — under the clock's per-update catch-up cap, so a day rolls in two steps. */
const HALF_DAY_MINUTES = 720;

test('a live crossing into dawn fires the chorus once, ordered by energy, with a 🌅 line', async ({ page }) => {
  await boot(page);

  await setClock(page, 3, 6, 59);
  expect(await dawnCount(page)).toBe(0); // staging the clock is a restore sync, never a beat

  await advanceWall(page, 120_000); // 06:59 → ~07:01, crossing the dawn hour live
  expect(await dawnCount(page)).toBe(1);

  const fired = await lastChorus(page);
  expect(fired).not.toBeNull();
  expect(fired!.length).toBeGreaterThan(0);
  expect(fired![0].delayMs).toBe(0);
  // the fired order matches what the pure function says of the current cast
  expect(fired!.map((e) => e.name)).toEqual((await chorusNow(page)).map((e) => e.name));

  expect((await events(page)).some((e) => e.includes('🌅'))).toBe(true);
});

test('the chorus fires at most once per in-game day, and a fresh day re-arms it', async ({ page }) => {
  await boot(page);

  await setClock(page, 5, 6, 59);
  await advanceWall(page, await wallMsFor(page, 2)); // day 5 dawn → 07:01
  expect(await dawnCount(page)).toBe(1);

  await advanceWall(page, await wallMsFor(page, HALF_DAY_MINUTES)); // → 19:01 same day, no dawn, no re-fire
  expect(await dawnCount(page)).toBe(1);

  await advanceWall(page, await wallMsFor(page, HALF_DAY_MINUTES)); // → 07:01 next day, day 6's dawn
  expect(await dawnCount(page)).toBe(2);
});

test('a restore-style clock set onto the dawn hour is silent (no live crossing)', async ({ page }) => {
  await boot(page);

  await setClock(page, 4, 7, 30); // staged straight onto hour 7 — no onHour tick
  expect(await dawnCount(page)).toBe(0);
  expect(await lastChorus(page)).toBeNull();
});

test('muted: the order still computes but nothing plays and the page stays clean', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await boot(page);

  await page.locator('canvas').focus();
  await page.keyboard.press('KeyM'); // mute (also unlocks audio via markActive)
  expect(await page.evaluate(() => (window as W).__soundMuted())).toBe(true);

  await setClock(page, 2, 6, 59);
  await advanceWall(page, 120_000); // live dawn while muted
  expect(await dawnCount(page)).toBe(1);
  expect(await lastChorus(page)).not.toBeNull(); // order is still computed

  await page.waitForTimeout(2000); // let every staggered delayedCall fire (spread ≤ 1.8s)
  expect(await page.evaluate(() => (window as W).__lastSound())).toBeNull(); // muted → no chirp intent
  expect(errors).toEqual([]);
});
