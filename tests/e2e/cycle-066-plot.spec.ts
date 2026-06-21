import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Plantable plot (BACKLOG-145). The keeper plants one plot; a crop grows over realtime-clock days;
 * harvesting releases it into the feeding loop. Drives headless via the plant/harvest + clock hooks
 * (no need to walk the keeper onto the tile).
 */

type W = Record<string, any>;

test('plant → grow over days → harvest into the feeding loop', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // Plant: an empty plot becomes a seed.
  const planted = await page.evaluate(() => (window as W).__plantPlot());
  expect(planted.stage).toBe('seed');
  const plantedDay = planted.plantedDay as number;

  // Grow: jump the clock two in-game days ahead and run a step — the crop ripens.
  await page.evaluate((d) => (window as W).__setClock(d + 2, 8, 0), plantedDay);
  await page.evaluate(() => (window as W).__stepWorld());
  expect((await page.evaluate(() => (window as W).__plot())).stage).toBe('ripe');

  // Harvest: a 🍓 crop drops into play, the plot empties, the tally rises.
  await page.evaluate(() => (window as W).__harvestPlot());
  const food = await page.evaluate(() => (window as W).__food());
  expect(food).not.toBeNull();
  expect(food.foodId).toBe('berries');
  expect(await page.evaluate(() => (window as W).__plot())).toBeNull();
  expect(await page.evaluate(() => (window as W).__harvested())).toBe(1);

  expect(errors).toEqual([]);
});

test('a growing (not-ripe) plot does not harvest', async ({ page }) => {
  await boot(page);
  const planted = await page.evaluate(() => (window as W).__plantPlot());
  // Only one day on — still a sprout, not ripe.
  await page.evaluate((d) => (window as W).__setClock(d + 1, 8, 0), planted.plantedDay);
  await page.evaluate(() => (window as W).__stepWorld());
  expect((await page.evaluate(() => (window as W).__plot())).stage).toBe('sprout');

  await page.evaluate(() => (window as W).__harvestPlot());
  // still planted, nothing harvested
  expect(await page.evaluate(() => (window as W).__plot())).not.toBeNull();
  expect(await page.evaluate(() => (window as W).__harvested())).toBe(0);
});
