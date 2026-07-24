import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * The granary (BACKLOG-454) — building finally feeds the food economy. A zone that has raised enough base
 * landmarks and can afford the recipe puts up a granary; a standing granary lifts that zone's food cap, so
 * a built-up ground banks a bigger surplus.
 */

type W = Record<string, any>;

const granaries = (p: import('@playwright/test').Page) => p.evaluate(() => (window as W).__granaries() as { zone: string }[]);
const foodCap = (p: import('@playwright/test').Page, z: string) => p.evaluate((zone) => (window as W).__foodCap(zone) as number, z);
const hasGranary = (p: import('@playwright/test').Page, z: string) => p.evaluate((zone) => (window as W).__hasGranary(zone) as boolean, z);
const seedReady = (p: import('@playwright/test').Page, z: string, n = 3) =>
  p.evaluate(({ zone, n }) => (window as W).__seedGranaryReady(zone, n), { zone: z, n });
const runBuild = (p: import('@playwright/test').Page, name: string) => p.evaluate((n) => (window as W).__runBuild(n), name);
const bankFood = (p: import('@playwright/test').Page, z: string, food: string) =>
  p.evaluate(({ zone, food }) => (window as W).__bankFood(zone, food) as number, { zone: z, food });

test('a zone with enough landmarks and the recipe raises a granary; the cap lifts 6 → 9', async ({ page }) => {
  await boot(page);
  expect(await hasGranary(page, 'bowl')).toBe(false);
  expect(await foodCap(page, 'bowl')).toBe(6);

  // Rex lives in the bowl at boot. Give the bowl 3 base landmarks + a {branch:3,stone:3} pile, then run the
  // on-gather build decision: the zone saves toward a granary and puts one up.
  await seedReady(page, 'bowl');
  await runBuild(page, 'Rex');

  const g = await granaries(page);
  expect(g.filter((x) => x.zone === 'bowl').length).toBe(1);
  expect(await hasGranary(page, 'bowl')).toBe(true);
  expect(await foodCap(page, 'bowl')).toBe(9);
});

test('below the landmark bar the same pile builds a bias landmark, not a granary', async ({ page }) => {
  await boot(page);
  // Only 2 landmarks — under GRANARY_AFTER_STRUCTURES(3) — so the zone still auto-builds its bias cairn.
  await seedReady(page, 'bowl', 2);
  await runBuild(page, 'Rex');
  expect((await granaries(page)).length).toBe(0);
  expect(await hasGranary(page, 'bowl')).toBe(false);
});

test('a granary lets the pantry bank past the flat cap of 6', async ({ page }) => {
  await boot(page);
  await seedReady(page, 'bowl');
  await runBuild(page, 'Rex');
  expect(await hasGranary(page, 'bowl')).toBe(true);

  // Bank the same food repeatedly; without a granary it would stall at 6, with one it climbs to 9.
  let total = 0;
  for (let i = 0; i < 12; i++) total = await bankFood(page, 'bowl', 'berries');
  expect(total).toBe(9);

  // Control: the grove has no granary, so it stalls at the flat cap.
  let groveTotal = 0;
  for (let i = 0; i < 12; i++) groveTotal = await bankFood(page, 'grove', 'berries');
  expect(groveTotal).toBe(6);
});
