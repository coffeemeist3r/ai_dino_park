import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Plot crop-stage pixel props (BACKLOG-317). The plot rendered its 🌱🌿🍓 stages as emoji; now each
 * stage swaps to a baked pixel prop. Empty plot → emoji (no rig); a planted seed → the baked crop_seed
 * texture. Driven by the existing plot dev hooks.
 */

type W = Record<string, any>;

test('the plot swaps to a baked crop prop once planted', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // Empty plot: no rig for 'empty' → emoji text sprite, so __plotArt is null.
  expect(await page.evaluate(() => (window as W).__plotArt())).toBeNull();

  // Plant a seed → the plot draws the baked crop_seed prop.
  const planted = await page.evaluate(() => (window as W).__plantPlot());
  expect(planted.stage).toBe('seed');
  expect(await page.evaluate(() => (window as W).__plotArt())).toBe('prop_crop_seed');

  expect(errors).toEqual([]);
});
