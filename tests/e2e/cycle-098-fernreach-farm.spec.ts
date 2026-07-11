import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * All three zones farm (BACKLOG-432). The Fernreach — the third zone — grows its own crop now: starchy
 * roots, on the same realtime-day clock as the bowl (berries) and grove (greens), fully independent.
 * Driven headless via the per-zone plant/harvest + clock hooks; the plot machinery is zone-generic.
 */

type W = Record<string, any>;

const plot = (p: Page, z: string) => p.evaluate((zz) => (window as W).__plot(zz), z);
const setClock = (p: Page, d: number, h: number, m: number) =>
  p.evaluate(([dd, hh, mm]) => (window as W).__setClock(dd, hh, mm), [d, h, m]);
const step = (p: Page) => p.evaluate(() => (window as W).__stepWorld());

test('the Fernreach grows and harvests its own roots, independent of the other plots', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // Plant the Fernreach plot directly (the zone arg targets it; keeper still in the bowl).
  const planted = await page.evaluate(() => (window as W).__plantPlot('fernreach'));
  expect(planted.stage).toBe('seed');
  const plantedDay = planted.plantedDay as number;

  // The bowl and grove plots are untouched — three independent plots.
  expect(await plot(page, 'bowl')).toBeNull();
  expect(await plot(page, 'grove')).toBeNull();

  // Grow: two in-game days on, the Fernreach crop ripens.
  await setClock(page, plantedDay + 2, 8, 0);
  await step(page);
  expect((await plot(page, 'fernreach')).stage).toBe('ripe');

  // Harvest: roots drop into play, the plot empties, the shared tally rises.
  await page.evaluate(() => (window as W).__harvestPlot('fernreach'));
  const food = await page.evaluate(() => (window as W).__food());
  expect(food).not.toBeNull();
  expect(food.foodId).toBe('roots');
  expect(await plot(page, 'fernreach')).toBeNull();
  expect(await page.evaluate(() => (window as W).__harvested())).toBe(1);

  expect(errors).toEqual([]);
});

test('a planted Fernreach plot survives save → reload', async ({ page }) => {
  await boot(page);
  const planted = await page.evaluate(() => (window as W).__plantPlot('fernreach'));
  const plantedDay = planted.plantedDay as number;
  await page.evaluate(() => (window as W).__saveNow());

  await page.reload();
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForFunction(() => (window as W).__ready === true, { timeout: 10_000 });

  const restored = await plot(page, 'fernreach');
  expect(restored).not.toBeNull();
  expect(restored.plantedDay).toBe(plantedDay);
});
