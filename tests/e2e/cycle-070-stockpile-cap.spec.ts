import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Stockpile capacity + pressure (BACKLOG-309). The shared per-kind pile caps at 8; banking a kind at
 * cap stalls — the pickup is consumed but nothing banks. Bank 9 branches with no stones (so no craft
 * fires to drain them) and the pile holds at 8: the 9th stalled.
 */

type W = Record<string, any>;
const TILE = 32;

const dinos = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__dinoPositions() as { name: string; x: number; y: number }[]);
const stockpile = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__stockpile() as Record<string, number>);

/** Drop a resource on the first dino and step so it banks immediately. */
async function bankOne(page: import('@playwright/test').Page, kind: string) {
  const ds = await dinos(page);
  const tx = Math.floor(ds[0].x / TILE);
  const ty = Math.floor(ds[0].y / TILE);
  await page.evaluate(({ kind, tx, ty }) => (window as W).__spawnResource(kind, tx, ty), { kind, tx, ty });
  await page.evaluate(() => (window as W).__stepWorld());
}

test('banking stalls at the per-kind cap', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // 9 branches, no stones → the craft recipe never fires, so nothing drains the pile.
  for (let i = 0; i < 9; i++) await bankOne(page, 'branch');

  expect((await stockpile(page)).branch).toBe(8); // the 9th pickup stalled at the cap, not banked
  expect(errors).toEqual([]);
});
