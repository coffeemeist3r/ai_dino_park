import { test, expect, type Page } from '@playwright/test';
import { boot, gatherToBowl } from './helpers';

/**
 * What a ground can hold (BACKLOG-476) — Milestone 11's second structure arc, and the first ceiling in a
 * park that has only ever had a floor. Capacity is derived from each ground's own terrain; a ground holding
 * more mouths than it can becomes less appealing to arrive at and holds its own residents more weakly.
 *
 * The calibration is the feature: the founding five-in-the-bowl state must read *uncrowded*, so the whole
 * system is dormant on a fresh save and every pinned migration spec is untouched.
 */

type W = Record<string, any>;

const caps = (p: Page) => p.evaluate(() => (window as W).__zoneCapacity() as Record<string, number>);
const crowded = (p: Page) => p.evaluate(() => (window as W).__crowded() as Record<string, boolean>);
const appeal = (p: Page, zone: string) => p.evaluate((z) => (window as W).__zoneAppeal(z) as number, zone);

test('each ground has a capacity derived from its own terrain', async ({ page }) => {
  await boot(page);
  // BACKLOG-478: derived, no capacity.ts edit — and BACKLOG-505 proves the claim a second time. The Saltpan
  // is crust with a two-column grass fringe, so `livableTiles` finds 30 where every other ground finds
  // 226–294, and it comes out holding **one mouth**. Nothing in capacity.ts was touched to get that, and it
  // is the right answer: a frontier that could absorb the cast would not be a frontier for long.
  expect(await caps(page)).toEqual({ bowl: 5, grove: 5, fernreach: 4, hollow: 5, saltpan: 1, ridge: 5 });
});

test('the founding park is at capacity, not over it', async ({ page }) => {
  await boot(page);
  expect(await crowded(page)).toEqual({ bowl: false, grove: false, fernreach: false, hollow: false, saltpan: false, ridge: false }); // BACKLOG-478/505
});

test('piling the cast onto one ground crowds it', async ({ page }) => {
  await boot(page);
  // the Fernreach holds four; send all five
  for (const name of ['Rex', 'Mossback', 'Sunny', 'Twitch', 'Glade']) {
    await page.evaluate((n) => (window as W).__migrate(n, 'fernreach'), name);
  }
  expect((await crowded(page)).fernreach).toBe(true);
  expect((await crowded(page)).bowl).toBe(false); // emptied, not crowded
});

test('a crowded ground is worth less than the same ground uncrowded', async ({ page }) => {
  await boot(page);
  await gatherToBowl(page); // CHARTER v7 seats a resident in the Fernreach; this case counts heads exactly
  // four into the Fernreach: exactly at capacity, and the baseline for the comparison
  for (const name of ['Rex', 'Mossback', 'Sunny', 'Twitch']) {
    await page.evaluate((n) => (window as W).__migrate(n, 'fernreach'), name);
  }
  expect((await crowded(page)).fernreach).toBe(false);
  const atCapacity = await appeal(page, 'fernreach');

  // the fifth mouth crowds it — nothing else about the ground changed
  await page.evaluate(() => (window as W).__migrate('Glade', 'fernreach'));
  expect((await crowded(page)).fernreach).toBe(true);
  const over = await appeal(page, 'fernreach');
  expect(over).toBeLessThan(atCapacity);
});

test('an uncrowded ground’s appeal is untouched — the identity that keeps every other pick stable', async ({
  page,
}) => {
  await boot(page);
  const before = await appeal(page, 'grove');
  await page.evaluate(() => (window as W).__migrate('Rex', 'grove'));
  await page.evaluate(() => (window as W).__migrate('Rex', 'bowl'));
  expect(await appeal(page, 'grove')).toBe(before);
});

test('capacity needs no save field — it re-derives on reload', async ({ page }) => {
  await boot(page);
  const before = await caps(page);
  await page.reload();
  await page.waitForFunction(() => (window as W).__ready === true);
  expect(await caps(page)).toEqual(before);
});
