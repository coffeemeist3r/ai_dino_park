import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Dino-built shelter (BACKLOG-315). Beyond the cairn (286): once a zone has stacked SHELTER_AFTER_CAIRNS
 * (3) cairns, it stops draining the shared pile on cairns and saves toward a larger lean-to (recipe
 * {branch:6, stone:4}). One shelter per zone, placed/persisted/zone-scoped like the cairn.
 */

type W = Record<string, any>;
const TILE = 32;

const dinos = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__dinoPositions() as { name: string; x: number; y: number }[]);
const stockpile = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__stockpile() as Record<string, number>);
const cairns = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__cairns() as { tileX: number; tileY: number }[]);
const shelters = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__shelters() as { tileX: number; tileY: number; zone: string }[]);
const exportSave = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__exportSave() as string);

/** Drop a resource on the first dino and step so it banks immediately (same as the cycle-064 helper). */
async function bankOne(page: import('@playwright/test').Page, kind: string) {
  const ds = await dinos(page);
  const tx = Math.floor(ds[0].x / TILE);
  const ty = Math.floor(ds[0].y / TILE);
  await page.evaluate(({ kind, tx, ty }) => (window as W).__spawnResource(kind, tx, ty), { kind, tx, ty });
  await page.evaluate(() => (window as W).__stepWorld());
}

/** Bank one cairn's worth (3 branch + 2 stone); the cairn fires on the 2nd stone. */
async function buildCairn(page: import('@playwright/test').Page) {
  for (const k of ['branch', 'branch', 'branch', 'stone', 'stone']) await bankOne(page, k);
}

test('a zone saves for a lean-to once it has stacked three cairns', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  expect(await shelters(page)).toEqual([]);

  // Stack the three cairns that unlock the shelter bar.
  await buildCairn(page);
  await buildCairn(page);
  await buildCairn(page);
  expect((await cairns(page)).length).toBe(3);
  expect((await shelters(page)).length).toBe(0);

  // Now the zone saves: banking a full cairn's worth does NOT make a 4th cairn — the pile climbs instead.
  await bankOne(page, 'branch');
  await bankOne(page, 'branch');
  await bankOne(page, 'branch');
  await bankOne(page, 'stone');
  await bankOne(page, 'stone');
  expect((await cairns(page)).length).toBe(3); // no 4th cairn — draining paused
  expect((await shelters(page)).length).toBe(0); // {branch:3,stone:2} — short of {6,4}

  // Top the pile up to the shelter recipe → exactly one lean-to.
  await bankOne(page, 'branch');
  await bankOne(page, 'branch');
  await bankOne(page, 'branch'); // branch → 6
  await bankOne(page, 'stone'); // stone → 3
  await bankOne(page, 'stone'); // stone → 4 → build

  expect((await shelters(page)).length).toBe(1);
  const pile = await stockpile(page);
  expect(pile.branch).toBe(0); // recipe spent exactly (6 - 6)
  expect(pile.stone).toBe(0); // (4 - 4)

  // The shelter is zone-scoped to the bowl and persisted in the save.
  const built = await shelters(page);
  expect(built[0].zone).toBe('bowl');

  // BACKLOG-344: the shelter renders as the baked lean-to prop, not the 🛖 glyph.
  expect(await page.evaluate(() => (window as W).__shelterArt())).toBe('prop_shelter');
  const save = JSON.parse(await exportSave(page));
  expect(save.shelters.length).toBe(1);
  expect(save.version).toBe(2); // additive — no version bump
  expect(errors).toEqual([]);
});
