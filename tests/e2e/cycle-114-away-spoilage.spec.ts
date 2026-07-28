import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Spoilage while you're away (BACKLOG-462) — the live per-day spoilage (455) rides an onHour hook that never
 * fires on a restore/away clock.set, so a hoard left through an absence used to survive untouched. The away
 * catch-up now bleeds the elapsed in-game days on the same capped, self-limiting decay and names it in the
 * "while you were away" digest. Driven through the real applyAwaySpoilage path via the __catchUp dev hook
 * (the same helper the boot restore calls). Default season is spring (day 1): cap 6, margin 1, floor 4.
 */

type W = Record<string, any>;
type CatchUp = { days: number; minutes: number; capped: boolean; digest: string[] };

const DAY_MS = 24 * 60 * 60_000; // one in-game day of real time at 1×

const setPile = (p: Page, zone: string, pile: Record<string, number>) =>
  p.evaluate(({ zone, pile }) => (window as W).__setZoneFoodPile(zone, pile), { zone, pile });
const foodPile = (p: Page, zone: string) =>
  p.evaluate((z) => (window as W).__zoneFoodPile(z) as Record<string, number>, zone);
const catchUp = (p: Page, ms: number) => p.evaluate((m) => (window as W).__catchUp(m) as CatchUp, ms);
const awayDigest = (p: Page) => p.evaluate(() => (window as W).__awayDigest() as string[]);

test('a hoard left through a multi-day absence bleeds toward its floor and reads in the digest', async ({ page }) => {
  await boot(page);
  await setPile(page, 'bowl', { berries: 6 }); // at the spring cap

  const result = await catchUp(page, 3 * DAY_MS); // three in-game days away
  expect(result.days).toBe(3);

  // 6 → 5 → 4 and holds at the flat-margin floor (cap-2). The pre-462 build left it at 6 untouched.
  expect((await foodPile(page, 'bowl')).berries).toBe(4);

  // No silent change — a 🥀 "spoiled" line naming the zone reached both the returned digest and __awayDigest.
  expect(result.digest.some((l) => l.includes('🥀') && l.includes('spoiled'))).toBe(true);
  expect((await awayDigest(page)).some((l) => l.includes('🥀') && l.includes('spoiled'))).toBe(true);
});

test('a sub-day absence leaves the hoard untouched and adds no spoilage line', async ({ page }) => {
  await boot(page);
  await setPile(page, 'grove', { berries: 6 });

  const result = await catchUp(page, DAY_MS / 2); // less than one in-game day
  expect(result.days).toBe(0);

  expect((await foodPile(page, 'grove')).berries).toBe(6);
  expect((await awayDigest(page)).some((l) => l.includes('🥀'))).toBe(false);
});
