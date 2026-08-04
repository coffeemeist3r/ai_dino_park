import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The ground's second decision (BACKLOG-473). 463 gave a provider one call — how the pantry spends. These
 * prove the second one: a **work priority** read off a *different* axis of the same temperament, wired into
 * the build decision, and legible on the zone-map lens.
 *
 * Roster temperaments the specs lean on (name-seeded, so they are stable forever):
 * Mossback 0.24/0.22 → gather+bank · Twitch 0.33/0.93 → gather+feed · Sunny 0.66/0.62 → build+feed ·
 * Rex 0.54/0.02 → build+bank. Twitch and Sunny are the pair that proves the two calls are independent:
 * the same spend stance, opposite work stances.
 */

type W = Record<string, any>;

const workPriority = (p: Page, z = 'bowl') => p.evaluate((zz) => (window as W).__workPriority(zz) as string | null, z);
const spendPriority = (p: Page, z = 'bowl') =>
  p.evaluate((zz) => (window as W).__spendPriority(zz) as string | null, z);
const cairns = (p: Page) => p.evaluate(() => (window as W).__cairns() as { zone: string }[]);
const zoneMap = (p: Page) =>
  p.evaluate(() => (window as W).__zoneMap() as Array<{ id: string; work: string | null; spend: string | null }>);

/** Plant the bowl plot, jump the clock past ripening, and harvest it (the cycle-107 helper). */
async function harvestBowl(page: Page): Promise<void> {
  const planted = await page.evaluate(() => (window as W).__plantPlot('bowl'));
  await page.evaluate((d) => (window as W).__setClock(d + 2, 8, 0), planted.plantedDay);
  await page.evaluate(() => (window as W).__stepWorld());
  await page.evaluate(() => (window as W).__harvestPlot('bowl'));
}

/** Leave exactly one dino in the bowl, then bank it three harvests so it emerges as the provider (448). */
async function soleProvider(page: Page, keep: string): Promise<void> {
  const names = await page.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));
  for (const n of names) {
    if (n !== keep) await page.evaluate((nn) => (window as W).__migrate(nn, 'grove'), n);
  }
  for (let i = 0; i < 3; i++) await harvestBowl(page);
}

test('a ground with no provider has no work policy — today’s behaviour, untouched', async ({ page }) => {
  await boot(page);
  expect(await workPriority(page)).toBeNull();
  for (const e of await zoneMap(page)) expect(e.work).toBeNull();
});

test('a calm provider gathers first, and the lens carries both calls', async ({ page }) => {
  await boot(page);
  await soleProvider(page, 'Twitch');
  expect(await page.evaluate(() => (window as W).__zoneProvider('bowl') as string | null)).toBe('Twitch');
  expect(await workPriority(page)).toBe('gather');
  expect(await spendPriority(page)).toBe('feed');

  const lens = (await zoneMap(page)).find((e) => e.id === 'bowl')!;
  expect(lens.work).toBe('gather');
  expect(lens.spend).toBe('feed');
});

test('a gather-first ground holds off the landmark while its pile is thin, and raises it once it is fat', async ({
  page,
}) => {
  await boot(page);
  await soleProvider(page, 'Mossback');
  expect(await workPriority(page)).toBe('gather');

  const before = (await cairns(page)).length;
  // Exactly the cairn recipe (branch 3 + stone 2 = 5) — affordable, but under WORK_BUILD_FLOOR (6).
  await page.evaluate(() => (window as W).__setZonePile('bowl', { branch: 3, stone: 2 }));
  await page.evaluate(() => (window as W).__runBuild('Mossback'));
  expect((await cairns(page)).length).toBe(before); // stores before walls

  await page.evaluate(() => (window as W).__setZonePile('bowl', { branch: 4, stone: 2 }));
  await page.evaluate(() => (window as W).__runBuild('Mossback'));
  expect((await cairns(page)).length).toBe(before + 1); // the pile cleared the floor, so the walls go up
});

test('a build-first ground never defers the same pile', async ({ page }) => {
  await boot(page);
  await soleProvider(page, 'Rex');
  expect(await workPriority(page)).toBe('build');

  const before = (await cairns(page)).length;
  await page.evaluate(() => (window as W).__setZonePile('bowl', { branch: 3, stone: 2 }));
  await page.evaluate(() => (window as W).__runBuild('Rex'));
  expect((await cairns(page)).length).toBe(before + 1);
});

test('the work policy persists across a reload', async ({ page }) => {
  await boot(page);
  await soleProvider(page, 'Mossback');
  expect(await workPriority(page)).toBe('gather');

  await page.reload();
  await page.waitForFunction(() => typeof (window as W).__workPriority === 'function');
  expect(await workPriority(page)).toBe('gather');
});
