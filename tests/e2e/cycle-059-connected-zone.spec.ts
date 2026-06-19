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

test('the keeper walks east into the grove and back into the bowl', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  expect(await zone(page)).toBe('bowl');

  // Walk east until the edge crossing flips the zone.
  await page.keyboard.down('ArrowRight');
  await expect.poll(() => zone(page), { timeout: 9000 }).toBe('grove');
  await page.keyboard.up('ArrowRight');
  expect(await playerX(page)).toBeLessThan(320); // arrived on the west side of the grove

  // Walk back west into the bowl.
  await page.keyboard.down('ArrowLeft');
  await expect.poll(() => zone(page), { timeout: 9000 }).toBe('bowl');
  await page.keyboard.up('ArrowLeft');
  expect(await playerX(page)).toBeGreaterThan(320); // arrived on the east side of the bowl

  expect(errors).toEqual([]);
});

test('a zone jump updates the plaque place name', async ({ page }) => {
  await boot(page);
  const place = (p: import('@playwright/test').Page) =>
    p.evaluate(() => ((window as W).__plaque() as { zone: string }).zone);

  expect(await place(page)).toBe('Pocket Cretaceous');
  await page.evaluate(() => (window as W).__setZone('grove'));
  expect(await place(page)).toBe('The Grove');
});
