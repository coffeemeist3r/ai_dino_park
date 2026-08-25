import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Meat and greens (BACKLOG-490, 4 of 7). The two ids the hatch drops most, and the two the founding cast's
 * favourites resolve to most often, stop being font glyphs.
 *
 * Proved the way 296, 419 and 135 proved theirs: the live sprite's *class* through a dev hook, never a
 * pixel comparison — and always in the pair, because the per-item emoji fallback is what lets a partial
 * roster ship at all, and a control nobody exercises is a control that has quietly stopped working.
 */

type W = Record<string, any>;

const drop = (p: Page, id: string) => p.evaluate((ii) => (window as W).__dropFood(3, ii), id);
const foodIsArt = (p: Page) => p.evaluate(() => (window as W).__foodIsArt() as boolean);
const hasRig = (p: Page, n: string) => p.evaluate((nn) => (window as W).__hasPropArt(nn) as boolean, n);

test('the hunk of meat lands as a baked rig', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  expect(await hasRig(page, 'food_meat')).toBe(true);
  await drop(page, 'meat');
  expect(await foodIsArt(page)).toBe(true);

  expect(errors).toEqual([]);
});

test('the leafy greens land as a baked rig', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  expect(await hasRig(page, 'food_greens')).toBe(true);
  await drop(page, 'greens');
  expect(await foodIsArt(page)).toBe(true);

  expect(errors).toEqual([]);
});

test('the three that were undrawn are drawn now — BACKLOG-490 closed at 7 of 7', async ({ page }) => {
  await boot(page);

  // This test said "roots, mushrooms and seeds are deliberately still glyphs. When this test has nothing
  // left to assert, BACKLOG-490 is complete and should be closed rather than the test weakened." Cycle
  // 140-art drew them; 490 is closed. The assertion is inverted rather than deleted so the fire that
  // finished the roster is visible from the fire that was two-thirds of the way there.
  for (const id of ['roots', 'mushrooms', 'seeds']) {
    expect([id, await hasRig(page, `food_${id}`)]).toEqual([id, true]);
  }
});
