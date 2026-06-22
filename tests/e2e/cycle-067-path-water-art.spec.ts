import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Path + water ground tiles render (BACKLOG-033). The grove terrain (294) defines path/water sub-regions;
 * now the pixel pipeline draws them instead of falling back to grass. Asserts the rigs are drawable and
 * the grove's terrain bake exists (it blits path/water where groveTileAt places them).
 */

type W = Record<string, any>;

test('path and water are now drawable ground tiles, and the grove bakes them in', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // the benched path/water rigs exist now (033 done) — grass already did.
  expect(await page.evaluate(() => (window as W).__hasTileArt('grass'))).toBe(true);
  expect(await page.evaluate(() => (window as W).__hasTileArt('path'))).toBe(true);
  expect(await page.evaluate(() => (window as W).__hasTileArt('water'))).toBe(true);
  // a genuinely undrawn ground kind still reports false (the flat-checker fallback control).
  expect(await page.evaluate(() => (window as W).__hasTileArt('lava'))).toBe(false);

  // crossing into the grove bakes its terrain (which now blits the path/water rigs).
  await page.evaluate(() => (window as W).__setZone('grove'));
  const info = await page.evaluate(() => (window as W).__floorInfo() as { key: string | null });
  expect(info.key).toContain('terrain_grove');

  expect(errors).toEqual([]);
});
