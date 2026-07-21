import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The provider role (BACKLOG-448) — the first emergent role read off the economy instead of the social
 * graph. A per-dino banked-food tally rises from two honest sources (the 447 courier carry, and the
 * resident that hauls a harvest's banked share to the store), and at PROVIDER_BANKS the dino emerges with
 * a durable `provider` 🧺 tag on the roles lens and in the book. Milestone 6 structure arc 3.
 */

type W = Record<string, any>;

const foodBanked = (p: Page) => p.evaluate(() => (window as W).__foodBanked() as Record<string, number>);
const roles = (p: Page) => p.evaluate(() => (window as W).__roles() as Record<string, string>);
const events = (p: Page) => p.evaluate(() => (window as W).__events() as string[]);
const dinoNames = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));

/** Plant the bowl plot, jump the clock past ripening, and harvest it. */
async function harvestBowl(page: Page) {
  const planted = await page.evaluate(() => (window as W).__plantPlot('bowl'));
  await page.evaluate((d) => (window as W).__setClock(d + 2, 8, 0), planted.plantedDay);
  await page.evaluate(() => (window as W).__stepWorld());
  await page.evaluate(() => (window as W).__harvestPlot('bowl'));
}

/** Leave exactly one dino living in the bowl, so the hauler pick is deterministic. */
async function onlyResident(page: Page, keep: string) {
  for (const n of await dinoNames(page)) {
    if (n !== keep) await page.evaluate((nn) => (window as W).__migrate(nn, 'grove'), n);
  }
}

test('the resident that hauls the harvest away is credited, and becomes the provider', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  await onlyResident(page, 'Rex');
  expect(await foodBanked(page)).toEqual({});
  expect((await roles(page)).Rex).not.toBe('provider');

  await harvestBowl(page);
  expect((await foodBanked(page)).Rex).toBe(1);
  expect((await events(page)).some((e) => e.includes('🧺') && e.includes('Rex put the harvest away'))).toBe(true);

  // Three banked units (PROVIDER_BANKS) and the park has a provider.
  await harvestBowl(page);
  await harvestBowl(page);
  expect((await foodBanked(page)).Rex).toBe(3);
  expect((await roles(page)).Rex).toBe('provider');
  expect(await page.evaluate(() => (window as W).__bookText() as string)).toContain('[provider]');

  expect(errors).toEqual([]);
});

test('a full pantry banks nothing, so nobody is credited for hauling nothing', async ({ page }) => {
  await boot(page);
  await onlyResident(page, 'Rex');

  // FOOD_STOCKPILE_CAP = 6 berries: the bowl's store cannot take another.
  await page.evaluate(() => (window as W).__setZoneFoodPile('bowl', { berries: 6 }));
  await harvestBowl(page);

  expect(await foodBanked(page)).toEqual({});
  expect((await events(page)).some((e) => e.includes('put the harvest away'))).toBe(false);
});

test('a courier that actually ferries a unit is credited too (447 → 448)', async ({ page }) => {
  await boot(page);

  await page.evaluate(() => (window as W).__setZoneFoodPile('bowl', { berries: 3 }));
  await page.evaluate(() => (window as W).__setZoneFoodPile('grove', {}));
  await page.evaluate(() => (window as W).__startMigration('Rex'));
  for (let i = 0; i < 40; i++) {
    await page.evaluate(() => (window as W).__stepWorld());
    if (!((await page.evaluate(() => (window as W).__migrating() as string[])).includes('Rex'))) break;
  }

  expect((await foodBanked(page)).Rex).toBe(1);
});
