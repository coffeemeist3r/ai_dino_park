import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Woke hungry (BACKLOG-376) — Milestone 5 lore arc 2. A dino over the hunger bar at the dawn boundary
 * breaks the morning's uniform chirp with a 🍖 stir, a temperament-shaded ticker line, and a memory.
 *
 * Staged off the cycle-045 chorus harness: __setClock is a restore sync (no beat), __advanceWall ticks the
 * listeners live. Needs are seeded with __setNeed and stay put — the needs tick rides the (paused) ambient
 * forceStep timer, not the clock, so nothing drifts mid-assert.
 *
 * Rex is seeded at 0.7 on purpose: over 376's pressing bar (0.6), under 444's starving bar (0.9) — the
 * band this whole milestone lives in. The bowl's stores can't reach him and shouldn't try.
 */

type W = Record<string, any>;

const events = (p: Page) => p.evaluate(() => (window as W).__events() as string[]);
const wokeHungry = (p: Page) => p.evaluate(() => (window as W).__wokeHungry() as string[]);
const dawnCount = (p: Page) => p.evaluate(() => (window as W).__dawnCount() as number);
const memoryOf = (p: Page, name: string) =>
  p.evaluate((n) => ((window as W).__memory() as Record<string, string[]>)[n] ?? [], name);
const setNeed = (p: Page, name: string, v: number) =>
  p.evaluate(({ name, v }) => (window as W).__setNeed(name, 'hunger', v), { name, v });
const setClock = (p: Page, d: number, h: number, m: number) =>
  p.evaluate(({ d, h, m }) => (window as W).__setClock(d, h, m), { d, h, m });
const advanceWall = (p: Page, ms: number) => p.evaluate((x) => (window as W).__advanceWall(x), ms);

const HALF_DAY_MS = 720 * 60_000; // 12 in-game hours at 1× — under the clock's catch-up cap, so roll a
                                  // day in two steps (a full day at once jumps via set() and fires no onHour)
const hungryLines = (log: string[]) => log.filter((e) => e.includes('woke hungry'));

test('the dino that went to bed hungry wakes differently — and the sated one does not (BACKLOG-376)', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  await setNeed(page, 'Rex', 0.7); // over the pressing bar, under starving
  await setNeed(page, 'Twitch', 0.1); // went to bed full

  await setClock(page, 3, 6, 59);
  expect(await wokeHungry(page)).toEqual([]); // staging the clock is a restore sync, never a beat

  await advanceWall(page, 120_000); // 06:59 → ~07:01, crossing the dawn hour live

  const woke = await wokeHungry(page);
  expect(woke).toContain('Rex');
  expect(woke).not.toContain('Twitch');

  const lines = hungryLines(await events(page));
  expect(lines).toHaveLength(1);
  expect(lines[0]).toContain('Rex');
  expect(lines[0]).toContain('🍖');

  expect((await memoryOf(page, 'Rex')).some((m) => m.includes('woke hungry'))).toBe(true);
  expect((await memoryOf(page, 'Twitch')).some((m) => m.includes('woke hungry'))).toBe(false);

  expect(errors).toEqual([]);
});

test('the dawn chorus still fires alongside the wake-hungry beat (BACKLOG-192 regression)', async ({ page }) => {
  await boot(page);

  await setNeed(page, 'Rex', 0.7);
  await setClock(page, 3, 6, 59);
  await advanceWall(page, 120_000);

  expect(await dawnCount(page)).toBe(1);
  expect((await events(page)).some((e) => e.includes('🌅'))).toBe(true);
  expect(await wokeHungry(page)).toContain('Rex');
});

test('the beat fires at most once per in-game day, and a fresh day re-arms it (BACKLOG-376)', async ({ page }) => {
  await boot(page);

  await setNeed(page, 'Rex', 0.7);

  await setClock(page, 5, 6, 59);
  await advanceWall(page, 120_000); // day 5 dawn
  expect(hungryLines(await events(page))).toHaveLength(1);

  await advanceWall(page, HALF_DAY_MS); // → 19:01 same day: no dawn, no re-fire
  expect(hungryLines(await events(page))).toHaveLength(1);

  await advanceWall(page, HALF_DAY_MS); // → 07:01 next day: day 6's dawn
  expect(hungryLines(await events(page))).toHaveLength(2);
});

test('a restore-style clock set onto the dawn hour wakes nobody (BACKLOG-376)', async ({ page }) => {
  await boot(page);

  await setNeed(page, 'Rex', 0.7);
  await setClock(page, 4, 7, 30); // staged straight onto hour 7 — no onHour tick

  expect(await wokeHungry(page)).toEqual([]);
  expect(hungryLines(await events(page))).toEqual([]);
});
