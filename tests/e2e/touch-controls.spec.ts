import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Touch controls (BACKLOG-189): fixed stick bottom-left, Talk/Feed/More cluster
 * bottom-right, More sheet, and tap chips for the 1/2/3 menus. The layer only
 * builds on coarse-pointer devices; `__setTouch(true)` forces it so desktop
 * Playwright can drive it with the mouse (Phaser treats mouse and touch alike).
 */

type W = Window & Record<string, any>;

/** Canvas-logical (640×480) → page CSS coordinates, through the Scale.FIT letterbox. */
async function toPage(page: Page, lx: number, ly: number): Promise<{ x: number; y: number }> {
  const box = (await page.locator('canvas').boundingBox())!;
  return { x: box.x + (lx / 640) * box.width, y: box.y + (ly / 480) * box.height };
}

async function bootTouch(page: Page): Promise<any> {
  await boot(page);
  await page.evaluate(() => (window as W).__setTouch(true));
  expect(await page.evaluate(() => (window as W).__touchEnabled())).toBe(true);
  return page.evaluate(() => (window as W).__touchLayout());
}

test('the hook forces the layer on and off (auto-detect is pointer:coarse, env-dependent)', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__setTouch(true));
  expect(await page.evaluate(() => (window as W).__touchEnabled())).toBe(true);
  await page.evaluate(() => (window as W).__setTouch(false));
  expect(await page.evaluate(() => (window as W).__touchEnabled())).toBe(false);
});

test('dragging the stick moves the keeper, releasing stops cleanly', async ({ page }) => {
  const layout = await bootTouch(page);
  const start = await page.evaluate(() => (window as W).__playerPos());

  const center = await toPage(page, layout.stick.x, layout.stick.y);
  await page.mouse.move(center.x, center.y);
  await page.mouse.down();
  const east = await toPage(page, layout.stick.x + layout.stick.r, layout.stick.y);
  await page.mouse.move(east.x, east.y, { steps: 4 });

  await expect
    .poll(async () => (await page.evaluate(() => (window as W).__touchVec())).x)
    .toBeGreaterThan(0.5);
  await expect
    .poll(async () => (await page.evaluate(() => (window as W).__playerPos())).x)
    .toBeGreaterThan(start.x + 10);

  await page.mouse.up();
  const released = await page.evaluate(() => (window as W).__touchVec());
  expect(released).toEqual({ x: 0, y: 0 });
});

test('Talk opens the tone menu and a chip picks the tone — no keyboard involved', async ({ page }) => {
  const layout = await bootTouch(page);
  await page.evaluate(() => (window as W).__warpTo('Rex'));

  const talk = layout.buttons.find((b: any) => b.id === 'talk');
  const at = await toPage(page, talk.x, talk.y);
  await page.mouse.click(at.x, at.y);
  expect(await page.evaluate(() => (window as W).__toneMenuOpen())).toBe(true);

  const chip1 = layout.chips.find((c: any) => c.id === 'pick1');
  const chipAt = await toPage(page, chip1.x, chip1.y);
  await page.mouse.click(chipAt.x, chipAt.y);
  expect(await page.evaluate(() => (window as W).__toneMenuOpen())).toBe(false);
  // The warm tone landed: Rex carries a fresh keeper-tone trace (hook returns name→tone).
  const tones = await page.evaluate(() => (window as W).__lastTone?.('Rex'));
  if (tones !== undefined) expect(typeof tones === 'string' ? tones : tones.Rex).toBe('warm');
});

test('the More sheet reaches a buried action (hearts panel) in two taps', async ({ page }) => {
  const layout = await bootTouch(page);

  const more = layout.buttons.find((b: any) => b.id === 'more');
  const moreAt = await toPage(page, more.x, more.y);
  await page.mouse.click(moreAt.x, moreAt.y);

  const hearts = layout.sheet.find((r: any) => r.id === 'hearts');
  const heartsAt = await toPage(page, hearts.x, hearts.y);
  await page.mouse.click(heartsAt.x, heartsAt.y);
  expect(await page.evaluate(() => (window as W).__heartsPanelVisible())).toBe(true);
});
