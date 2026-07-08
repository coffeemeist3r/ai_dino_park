import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Grove plot (BACKLOG-349). The plantable plot (145) was a bowl-only fixture (308); now each zone has
 * its own plot. The grove plants/grows/harvests its own crop on the same realtime-day clock, fully
 * independent of the bowl's plot. Driven headless via the per-zone plant/harvest + clock hooks.
 */

type W = Record<string, any>;

const plot = (p: Page, z: string) => p.evaluate((zz) => (window as W).__plot(zz), z);
const setClock = (p: Page, d: number, h: number, m: number) =>
  p.evaluate(([dd, hh, mm]) => (window as W).__setClock(dd, hh, mm), [d, h, m]);
const step = (p: Page) => p.evaluate(() => (window as W).__stepWorld());

test('the grove grows its own crop, independent of the bowl plot', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // Plant the grove plot (keeper still in the bowl — the zone arg targets the grove directly).
  const planted = await page.evaluate(() => (window as W).__plantPlot('grove'));
  expect(planted.stage).toBe('seed');
  const plantedDay = planted.plantedDay as number;

  // The bowl plot is untouched — the two plots are independent.
  expect(await plot(page, 'bowl')).toBeNull();

  // Grow: two in-game days on, the grove crop ripens.
  await setClock(page, plantedDay + 2, 8, 0);
  await step(page);
  expect((await plot(page, 'grove')).stage).toBe('ripe');

  // Harvest the grove crop: the grove grows *greens* now (BACKLOG-418 — per-zone crops), so greens drop
  // into play, the grove plot empties, the shared tally rises.
  await page.evaluate(() => (window as W).__harvestPlot('grove'));
  const food = await page.evaluate(() => (window as W).__food());
  expect(food).not.toBeNull();
  expect(food.foodId).toBe('greens');
  expect(await plot(page, 'grove')).toBeNull();
  expect(await page.evaluate(() => (window as W).__harvested())).toBe(1);

  expect(errors).toEqual([]);
});

test('both plots can hold crops at once without interfering', async ({ page }) => {
  await boot(page);

  const bowl = await page.evaluate(() => (window as W).__plantPlot('bowl'));
  const grove = await page.evaluate(() => (window as W).__plantPlot('grove'));
  expect(bowl.stage).toBe('seed');
  expect(grove.stage).toBe('seed');

  // Ripen and harvest only the bowl — the grove crop stays planted.
  await setClock(page, (bowl.plantedDay as number) + 2, 8, 0);
  await step(page);
  await page.evaluate(() => (window as W).__harvestPlot('bowl'));
  expect(await plot(page, 'bowl')).toBeNull();
  expect(await plot(page, 'grove')).not.toBeNull();
});
