import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Food flows between zones (BACKLOG-447) + the courier's pride (BACKLOG-451). A dino making a visible
 * crossing ferries one banked food unit from the zone it leaves toward the lighter neighbour it enters
 * (the food twin of the resource carry, cycle-073), and — when a unit actually moves — earns a 📦 courier
 * beat + a "carried food to <zone>" memory. Nothing moves when the source zone has no surplus.
 */

type W = Record<string, any>;

const step = (p: import('@playwright/test').Page) => p.evaluate(() => (window as W).__stepWorld());
const migrating = (p: import('@playwright/test').Page) =>
  p.evaluate(() => (window as W).__migrating() as string[]);
const foodPile = (p: import('@playwright/test').Page, zone: string) =>
  p.evaluate((z) => (window as W).__zoneFoodPile(z) as Record<string, number>, zone);
const events = (p: import('@playwright/test').Page) => p.evaluate(() => (window as W).__events() as string[]);
const memoryOf = (p: import('@playwright/test').Page, name: string) =>
  p.evaluate((n) => ((window as W).__memory() as Record<string, string[]>)[n] ?? [], name);

async function crossRex(page: import('@playwright/test').Page) {
  await page.evaluate(() => (window as W).__startMigration('Rex'));
  for (let i = 0; i < 40; i++) {
    await step(page);
    if (!(await migrating(page)).includes('Rex')) return true;
  }
  return false;
}

test('a crossing dino ferries a banked food unit toward the lighter neighbour, and earns the courier beat', async ({
  page,
}) => {
  await boot(page);

  // Bowl (Rex's home) holds a berry surplus; the grove has none — food should flow bowl → grove.
  await page.evaluate(() => (window as W).__setZoneFoodPile('bowl', { berries: 3 }));
  await page.evaluate(() => (window as W).__setZoneFoodPile('grove', {}));

  expect(await crossRex(page)).toBe(true);

  // Exactly one unit moved (a lean, one per crossing).
  expect((await foodPile(page, 'bowl')).berries).toBe(2);
  expect((await foodPile(page, 'grove')).berries).toBe(1);

  // The courier's pride (451): a ticker line names the carry and Rex keeps the courier memory.
  expect((await events(page)).some((e) => e.includes('Rex carried food to'))).toBe(true);
  expect((await memoryOf(page, 'Rex')).some((m) => m.includes('carried') && m.includes('ran short'))).toBe(true);
});

test('a crossing with no food surplus in the source zone moves nothing and earns no pride', async ({ page }) => {
  await boot(page);

  await page.evaluate(() => (window as W).__setZoneFoodPile('bowl', {}));
  await page.evaluate(() => (window as W).__setZoneFoodPile('grove', {}));

  expect(await crossRex(page)).toBe(true);

  expect(await foodPile(page, 'grove')).toEqual({});
  expect((await events(page)).some((e) => e.includes('Rex carried food to'))).toBe(false);
  expect((await memoryOf(page, 'Rex')).some((m) => m.includes('ran short'))).toBe(false);
});
