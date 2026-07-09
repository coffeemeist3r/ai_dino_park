import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Per-zone crop identity (BACKLOG-418) — each zone's plot grows a crop suited to it. The bowl keeps its
 * berries (byte-identical); the shaded grove grows leafy greens with a distinct 🥬 ripe marker, releasing
 * greens (not berries) into the feeding loop when harvested. Driven headless via the plant/clock/harvest hooks.
 */

type W = Record<string, any>;

const ripen = async (page: Page, zone: string) => {
  const planted = await page.evaluate((z) => (window as W).__plantPlot(z), zone);
  await page.evaluate((d) => (window as W).__setClock(d + 2, 8, 0), planted.plantedDay);
  await page.evaluate(() => (window as W).__stepWorld());
  expect((await page.evaluate((z) => (window as W).__plot(z), zone)).stage).toBe('ripe');
};

test('the grove grows greens with a 🥬 marker, and harvests greens into the feeding loop', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  await ripen(page, 'grove');

  // The ripe grove plot bakes its OWN greens rig (BACKLOG-434) — an Image, not the 🥬 glyph fallback, and a
  // different texture from the bowl's berry bush.
  const groveArt = await page.evaluate(() => (window as W).__plotArt('grove'));
  expect(groveArt).not.toBeNull();
  expect(groveArt).toContain('crop_ripe_greens');
  expect(await page.evaluate(() => (window as W).__plotGlyph('grove'))).toBeNull(); // no glyph fallback now

  // Harvest releases *greens* (not berries) into the feeding loop.
  await page.evaluate(() => (window as W).__harvestPlot('grove'));
  const food = await page.evaluate(() => (window as W).__food());
  expect(food.foodId).toBe('greens');
  const events = await page.evaluate(() => (window as W).__events() as string[]);
  expect(events.some((e) => e.includes('🥬') && e.includes('harvested'))).toBe(true);

  expect(errors).toEqual([]);
});

test('the bowl plot is byte-identical — berries, 🍓 marker, the berry-bush prop', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  await ripen(page, 'bowl');

  // Bowl ripe still renders the baked berry-bush rig (an Image, not a glyph fallback).
  expect(await page.evaluate(() => (window as W).__plotArt('bowl'))).not.toBeNull();

  await page.evaluate(() => (window as W).__harvestPlot('bowl'));
  const food = await page.evaluate(() => (window as W).__food());
  expect(food.foodId).toBe('berries');

  expect(errors).toEqual([]);
});
