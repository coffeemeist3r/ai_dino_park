import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The food the hatch drops (BACKLOG-490) and the egg by the den (BACKLOG-491).
 *
 * Proves the swap the way 296 and 419 proved theirs: the live sprite's *class* is read through a dev hook,
 * never a pixel comparison. The load-bearing assertion is the pair — a drawn id bakes, an undrawn id keeps
 * its emoji — because the per-item fallback is what lets a partial roster ship without breaking the park.
 */

type W = Record<string, any>;

const drop = (p: Page, id: string) => p.evaluate((ii) => (window as W).__dropFood(3, ii), id);
const clearFood = (p: Page) => p.evaluate(() => (window as W).__clearFood?.());
const foodIsArt = (p: Page) => p.evaluate(() => (window as W).__foodIsArt() as boolean);
const eggIsArt = (p: Page) => p.evaluate(() => (window as W).__eggIsArt() as boolean);
const hasRig = (p: Page, n: string) => p.evaluate((nn) => (window as W).__hasPropArt(nn) as boolean, n);
const roster = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));

test('a drawn food id lands as a baked rig', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  expect(await hasRig(page, 'food_fish')).toBe(true);
  await drop(page, 'fish');
  expect(await foodIsArt(page)).toBe(true);

  expect(errors).toEqual([]);
});

test('an undrawn food id keeps its emoji — the fallback a partial roster rides on', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // Deliberately an id with no rig yet. If this ever fails because the roster completed, 490 is done.
  expect(await hasRig(page, 'food_mushrooms')).toBe(false);
  await drop(page, 'mushrooms');
  expect(await foodIsArt(page)).toBe(false); // still a Text glyph, and the park is fine

  expect(errors).toEqual([]);
});

test('the egg by the den is drawn, not typed', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  const names = await roster(page);
  await page.evaluate(([a, b]) => (window as W).__layEgg(a, b), [names[0], names[1]]);
  expect(await page.evaluate(() => ((window as W).__eggs() as unknown[]).length)).toBeGreaterThan(0);
  expect(await eggIsArt(page)).toBe(true);

  expect(errors).toEqual([]);
});
