import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Per-crop seasonal yield (BACKLOG-465) — the half 461 deferred. The table itself is unit-covered
 * (cycle-118-crop-season.test.ts); this proves the integration seam: the harvest hook actually banks what
 * the table says, the cap still binds over it, spring is byte-identical, and neither the doubling nor the
 * cancelling happens silently.
 */

type W = Record<string, any>;

const pile = (p: Page, zone = 'bowl') =>
  p.evaluate((z) => (window as W).__zoneFoodPile(z) as Record<string, number>, zone);
const berries = async (p: Page) => (await pile(p)).berries ?? 0;
const events = (p: Page) => p.evaluate(() => (window as W).__events() as string[]);
const foodCap = (p: Page, zone = 'bowl') => p.evaluate((z) => (window as W).__foodCap(z) as number, zone);
const setClock = (p: Page, d: number, h = 8, m = 0) =>
  p.evaluate(({ d, h, m }) => (window as W).__setClock(d, h, m), { d, h, m });

/** Plant on `day`, ripen in place, harvest. Both days stay inside the season `day` falls in (a season is 7
 *  days and ripening takes 2), so the whole grow-to-harvest happens in one season. */
async function growAndHarvest(page: Page, day: number) {
  await setClock(page, day);
  const planted = await page.evaluate(() => (window as W).__plantPlot('bowl'));
  await setClock(page, planted.plantedDay + 2);
  await page.evaluate(() => (window as W).__stepWorld());
  await page.evaluate(() => (window as W).__harvestPlot('bowl'));
}

test('the table the sim runs on rotates the chain through the year', async ({ page }) => {
  await boot(page);
  const y = (food: string, season: string) =>
    page.evaluate(({ food, season }) => (window as W).__cropYield(food, season) as number, { food, season });

  // Each season has one thriving ground and one thin one; spring is nobody's.
  expect(await y('berries', 'summer')).toBe(2);
  expect(await y('roots', 'summer')).toBe(0);
  expect(await y('greens', 'fall')).toBe(2);
  expect(await y('berries', 'fall')).toBe(0);
  expect(await y('roots', 'winter')).toBe(2);
  expect(await y('greens', 'winter')).toBe(0);
  for (const f of ['berries', 'greens', 'roots']) expect(await y(f, 'spring')).toBe(1);
});

test('a fresh boot is spring, and a spring harvest banks exactly one, silently', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const before = await berries(page);
  await growAndHarvest(page, 1); // day 1 → plant, day 3 → harvest; both spring
  expect(await berries(page)).toBe(before + 1);

  const log = await events(page);
  expect(log.some((e) => /came in thick|lean year/.test(e))).toBe(false);
  expect(errors).toEqual([]);
});

test('summer banks the bowl double, and says so', async ({ page }) => {
  await boot(page);

  const before = await berries(page);
  await growAndHarvest(page, 8); // day 8 → plant, day 10 → harvest; both summer
  expect(await berries(page)).toBe(before + 2);

  const log = await events(page);
  expect(log.some((e) => e.includes('came in thick'))).toBe(true);
});

test('fall banks the bowl nothing — but the crop is still harvested and still drops', async ({ page }) => {
  await boot(page);

  const before = await berries(page);
  const harvestsBefore = await page.evaluate(() => (window as W).__harvested() as number);
  await growAndHarvest(page, 15); // day 15 → plant, day 17 → harvest; both fall

  expect(await berries(page)).toBe(before); // nothing banked
  expect(await page.evaluate(() => (window as W).__harvested() as number)).toBe(harvestsBefore + 1);
  expect(await page.evaluate(() => (window as W).__plot('bowl'))).toBeNull(); // the plot cleared

  const log = await events(page);
  expect(log.some((e) => e.includes('lean year'))).toBe(true);
  expect(log.some((e) => e.includes('you harvested the crop'))).toBe(true);
});

test('a good season never banks past the cap', async ({ page }) => {
  await boot(page);

  await setClock(page, 8); // summer, so the cap read below is the summer cap
  const cap = await foodCap(page);
  while ((await berries(page)) < cap - 1) {
    await page.evaluate(() => (window as W).__bankFood('bowl', 'berries'));
  }
  expect(await berries(page)).toBe(cap - 1);

  await growAndHarvest(page, 8); // a double-yield harvest with room for only one
  expect(await berries(page)).toBe(cap);
});

test('the season turn announces which ground the year now favours', async ({ page }) => {
  await boot(page);

  await setClock(page, 7, 23, 59);
  await page.evaluate(() => (window as W).__advanceWall(120_000)); // over midnight into summer

  const log = await events(page);
  expect(log.some((e) => e.includes('🌾') && e.includes('summer'))).toBe(true);
});
