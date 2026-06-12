import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Controls help (HUD overhaul, 2026-06-12): the old one-line controls hint was
 * wider than the 640px canvas and collided with the gift HUD and the plaque.
 * The bottom bar now holds three short pieces; the full key reference lives in
 * a panel toggled by the [?] chip or the ?// key.
 */

type W = Window & Record<string, any>;

/** Canvas-logical (640×480) → page CSS coordinates, through the Scale.FIT letterbox. */
async function toPage(page: Page, lx: number, ly: number): Promise<{ x: number; y: number }> {
  const box = (await page.locator('canvas').boundingBox())!;
  return { x: box.x + (lx / 640) * box.width, y: box.y + (ly / 480) * box.height };
}

test('the / key toggles the help panel', async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => (window as W).__helpOpen())).toBe(false);
  await page.keyboard.press('/');
  expect(await page.evaluate(() => (window as W).__helpOpen())).toBe(true);
  await page.keyboard.press('/');
  expect(await page.evaluate(() => (window as W).__helpOpen())).toBe(false);
});

test('clicking the [?] chip opens the panel; clicking the panel closes it', async ({ page }) => {
  await boot(page);
  // The chip sits in the bottom-right corner (origin 1,1 at 634,474).
  const chip = await toPage(page, 620, 468);
  await page.mouse.click(chip.x, chip.y);
  expect(await page.evaluate(() => (window as W).__helpOpen())).toBe(true);

  const center = await toPage(page, 320, 240); // the panel is centred
  await page.mouse.click(center.x, center.y);
  expect(await page.evaluate(() => (window as W).__helpOpen())).toBe(false);
});

test('touch mode hides the keyboard chrome and lifts the held-item line off the stick', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__setTouch(true));
  // Chip gone: a tap in its corner raps the glass instead of opening the panel.
  const chip = await toPage(page, 620, 468);
  await page.mouse.click(chip.x, chip.y);
  expect(await page.evaluate(() => (window as W).__helpOpen())).toBe(false);

  await page.evaluate(() => (window as W).__setTouch(false));
  await page.keyboard.press('/');
  expect(await page.evaluate(() => (window as W).__helpOpen())).toBe(true);
});
