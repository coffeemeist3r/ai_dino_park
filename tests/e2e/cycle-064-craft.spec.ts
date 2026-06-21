import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * First craft (BACKLOG-286). Once the shared park stockpile (285) covers the recipe (3 branch + 2 stone),
 * the dino that just banked stacks a cairn (🗿) in the bowl and the stockpile is spent by exactly that
 * cost. Cairns persist in the save. Spawn resources on a dino, step, watch it bank then build.
 */

type W = Record<string, any>;
const TILE = 32;

const dinos = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__dinoPositions() as { name: string; x: number; y: number }[]);
const stockpile = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__stockpile() as Record<string, number>);
const cairns = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__cairns() as { tileX: number; tileY: number }[]);
const exportSave = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__exportSave() as string);

/** Drop a resource on the first dino and step so it banks immediately. */
async function bankOne(page: import('@playwright/test').Page, kind: string) {
  const ds = await dinos(page);
  const tx = Math.floor(ds[0].x / TILE);
  const ty = Math.floor(ds[0].y / TILE);
  await page.evaluate(({ kind, tx, ty }) => (window as W).__spawnResource(kind, tx, ty), { kind, tx, ty });
  await page.evaluate(() => (window as W).__stepWorld());
}

test('a stockpile that clears the recipe becomes a cairn', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  expect(await cairns(page)).toEqual([]);

  // Bank 3 branch + 2 stone. The craft fires on the pickup that first clears both thresholds.
  await bankOne(page, 'branch');
  await bankOne(page, 'branch');
  await bankOne(page, 'branch');
  await bankOne(page, 'stone');
  expect(await cairns(page)).toEqual([]); // {branch:3, stone:1} — a stone short, no cairn yet
  expect((await stockpile(page)).branch).toBe(3);

  await bankOne(page, 'stone'); // {branch:3, stone:2} → craft

  expect((await cairns(page)).length).toBe(1);
  const pile = await stockpile(page);
  expect(pile.branch).toBe(0); // recipe spent exactly
  expect(pile.stone).toBe(0);

  // The cairn is in the exported save.
  const save = JSON.parse(await exportSave(page));
  expect(save.cairns.length).toBe(1);
  expect(save.version).toBe(2); // additive — no version bump
  expect(errors).toEqual([]);
});

test('no second cairn without rebuilding the stockpile', async ({ page }) => {
  await boot(page);
  for (const k of ['branch', 'branch', 'branch', 'stone', 'stone']) await bankOne(page, k);
  expect((await cairns(page)).length).toBe(1);

  // One more pickup leaves the pile below the recipe → still exactly one cairn.
  await bankOne(page, 'branch');
  expect((await cairns(page)).length).toBe(1);

  // Rebuild to the threshold → a second cairn.
  await bankOne(page, 'branch'); // branch 1→2... need 3 + 2 stone
  await bankOne(page, 'branch');
  await bankOne(page, 'stone');
  await bankOne(page, 'stone');
  expect((await cairns(page)).length).toBe(2);
});
