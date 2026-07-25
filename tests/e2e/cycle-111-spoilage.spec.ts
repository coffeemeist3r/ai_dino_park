import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * A pantry that spoils (BACKLOG-455) — banked food at/near a zone's cap bleeds one unit per in-game day to a
 * safe floor, so a hoard costs something and the milestone's flows stay live. Driven through the real
 * `runSpoilage` path via the __spoilFood dev hook; the day hook that calls it is live-only (onHour).
 */

type W = Record<string, any>;

const setPile = (p: Page, zone: string, pile: Record<string, number>) =>
  p.evaluate(({ zone, pile }) => (window as W).__setZoneFoodPile(zone, pile), { zone, pile });
const spoil = (p: Page) => p.evaluate(() => (window as W).__spoilFood() as Record<string, Record<string, number>>);
const foodPile = (p: Page, zone: string) =>
  p.evaluate((z) => (window as W).__zoneFoodPile(z) as Record<string, number>, zone);
const events = (p: Page) => p.evaluate(() => (window as W).__events() as string[]);

test('a hoard at cap bleeds one per day down to the floor (cap-2), then holds', async ({ page }) => {
  await boot(page);
  await setPile(page, 'grove', { berries: 6 }); // flat cap

  expect((await spoil(page)).grove.berries).toBe(5);
  expect((await spoil(page)).grove.berries).toBe(4);
  // self-limits: 4 is below the near-cap band, so it holds
  expect((await spoil(page)).grove.berries).toBe(4);

  // no silent change — a 🥀 spoilage line reached the ticker
  expect((await events(page)).some((e) => e.includes('🥀') && e.includes('spoiled'))).toBe(true);
});

test('a circulating pile below the near-cap band is never touched', async ({ page }) => {
  await boot(page);
  await setPile(page, 'bowl', { berries: 4 }); // cap 6 → 4 is already the floor
  await spoil(page);
  expect((await foodPile(page, 'bowl')).berries).toBe(4);
});

test('a restore / clock jump does not spoil (the day hook is live-only)', async ({ page }) => {
  await boot(page);
  await setPile(page, 'grove', { berries: 6 });
  const before = (await events(page)).filter((e) => e.includes('🥀')).length;

  // __setClock stages the clock like a restore — onHour never fires on clock.set, so no spoilage pass.
  await page.evaluate(() => (window as W).__setClock(5, 12, 0));

  expect((await foodPile(page, 'grove')).berries).toBe(6);
  expect((await events(page)).filter((e) => e.includes('🥀')).length).toBe(before);
});
