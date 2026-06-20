import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Connected zone (BACKLOG-143). Walking the keeper off the bowl's east edge crosses into the grove
 * (repositioned to the west side), and walking back off the grove's west edge returns to the bowl.
 * The grove is empty this cycle (population is BACKLOG-274); this proves the walkable, tracked spine.
 */

type W = Record<string, any>;
const zone = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as W).__zone() as string);
const playerX = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ((window as W).__playerPos() as { x: number }).x);
// Place the keeper past an edge, then run the real crossing check once. Deterministic — no reliance on
// rAF frame-count, which throttles to a crawl under the parallel load a 2-core CI runner sees.
const placeAndCross = (page: import('@playwright/test').Page, x: number) =>
  page.evaluate((x) => {
    (window as W).__setPlayer(x, 240);
    (window as W).__tryCross();
  }, x);

test('the keeper walks east into the grove and back into the bowl', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  expect(await zone(page)).toBe('bowl');

  // Step off the east edge (past 624 = COLS*TILE - TILE/2) → cross into the grove, repositioned west.
  await placeAndCross(page, 630);
  expect(await zone(page)).toBe('grove');
  expect(await playerX(page)).toBeLessThan(320);

  // Step off the grove's west edge (past 16 = TILE/2) → back into the bowl, repositioned east.
  await placeAndCross(page, 10);
  expect(await zone(page)).toBe('bowl');
  expect(await playerX(page)).toBeGreaterThan(320);

  expect(errors).toEqual([]);
});

test('the crossing is a no-op off an unlinked edge — the keeper stays put', async ({ page }) => {
  await boot(page);
  // The bowl's west edge has no link; crossing must not fire (the keeper clamps normally instead).
  await placeAndCross(page, 5);
  expect(await zone(page)).toBe('bowl');
});

test('dinos draw only in their own zone — the grove is empty (BACKLOG-143)', async ({ page }) => {
  await boot(page);
  const visible = (p: import('@playwright/test').Page) =>
    p.evaluate(() => (window as W).__visibleDinos() as string[]);

  // The whole roster lives in the bowl, so it's all drawn here.
  expect((await visible(page)).length).toBeGreaterThan(0);

  // Cross into the (empty) grove — no dino should be drawn there.
  await page.evaluate(() => (window as W).__setZone('grove'));
  expect(await visible(page)).toEqual([]);

  // Back in the bowl, the roster is drawn again.
  await page.evaluate(() => (window as W).__setZone('bowl'));
  expect((await visible(page)).length).toBeGreaterThan(0);
});

test('a zone jump updates the plaque place name', async ({ page }) => {
  await boot(page);
  const place = (p: import('@playwright/test').Page) =>
    p.evaluate(() => ((window as W).__plaque() as { zone: string }).zone);

  expect(await place(page)).toBe('Pocket Cretaceous');
  await page.evaluate(() => (window as W).__setZone('grove'));
  expect(await place(page)).toBe('The Grove');
});
