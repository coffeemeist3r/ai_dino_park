import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Gen3 grass floor (BACKLOG-033). The bowl's whole ground is now a baked pixel-grass texture
 * instead of a flat two-green checker. These prove it bakes on boot and spans the map; the
 * tile rig itself (dimensions, palette, seamless border) is pinned by the unit tests.
 */

type W = Window & Record<string, any>;

test('the grass floor bakes on boot', async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => (window as W).__groundReady())).toBe(true);
});

test('the baked ground spans the whole bowl (20×15 world tiles at 32px)', async ({ page }) => {
  await boot(page);
  const size = (await page.evaluate(() => (window as W).__groundSize())) as [number, number];
  expect(size).toEqual([20 * 32, 15 * 32]); // COLS×TILE by ROWS×TILE
});
