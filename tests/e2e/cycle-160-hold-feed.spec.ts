import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';
import { LONG_PRESS_MS } from '../../game/src/input/touch';
import { feedChoices } from '../../game/src/world/foods';
import { feedLine } from '../../game/src/ui/controlsHelp';

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

const loadedFeed = (p: Page) => p.evaluate(() => (window as W).__loadedFeed() as string);
const foodInPlay = (p: Page) => p.evaluate(() => (window as W).__food());
const hudText = (p: Page) => p.evaluate(() => (window as W).__giftHudText() as string);

async function feedButton(page: Page, layout: any) {
  const b = layout.buttons.find((x: any) => x.id === 'feed');
  expect(b, 'the action cluster still carries the feed button').toBeDefined();
  return toPage(page, b.x, b.y);
}

/**
 * BACKLOG-547 — the phone keeper reaches the hatch selector.
 *
 * The Android PWA auto-deploys off `main` and is a shipping surface. On it the loaded feed (067) was
 * whatever the save happened to hold: no gesture anywhere in the touch layer reached `cycleFeedBy`. The
 * More sheet could not take an eleventh row (BACKLOG-552), so the second verb goes on the button.
 */
test('a tap on the feed button still drops, and changes nothing about the selector', async ({ page }) => {
  const layout = await bootTouch(page);
  const before = await loadedFeed(page);
  const at = await feedButton(page, layout);

  await page.mouse.move(at.x, at.y);
  await page.mouse.down();
  await page.mouse.up();

  await expect.poll(() => foodInPlay(page), { message: 'a tap drops' }).not.toBeNull();
  expect(await loadedFeed(page)).toBe(before);
});

test('a hold on the feed button steps the loaded feed and drops nothing', async ({ page }) => {
  const layout = await bootTouch(page);
  const before = await loadedFeed(page);
  const at = await feedButton(page, layout);

  await page.mouse.move(at.x, at.y);
  await page.mouse.down();
  // Wait for the STATE, never for the duration (the cycle-159 lesson): the hold is counted on the scene
  // clock, and a wall-clock sleep against a scene timer is what put CI red for four days.
  await expect.poll(() => loadedFeed(page), { message: 'the hold steps the selector' }).not.toBe(before);
  await page.mouse.up();

  expect(await foodInPlay(page), 'and the hold drops nothing').toBeNull();
});

test('a hold steps exactly once, however long it is held', async ({ page }) => {
  const layout = await bootTouch(page);
  const before = await loadedFeed(page);
  const at = await feedButton(page, layout);

  await page.mouse.move(at.x, at.y);
  await page.mouse.down();
  await expect.poll(() => loadedFeed(page)).not.toBe(before);
  const afterFirst = await loadedFeed(page);
  await page.waitForTimeout(LONG_PRESS_MS * 3); // a hold is a step, not a scroll
  await page.mouse.up();

  expect(await loadedFeed(page)).toBe(afterFirst);
  expect(await foodInPlay(page)).toBeNull();
});

test('the HUD under the thumb says what is loaded now', async ({ page }) => {
  await bootTouch(page);
  await page.evaluate(() => (window as W).__feedPressStart());
  await expect.poll(() => loadedFeed(page)).not.toBe('auto');
  await page.evaluate(() => (window as W).__feedPressEnd());

  const id = await loadedFeed(page);
  const label = feedChoices().find((c) => c.id === id)!.label;
  expect(await hudText(page), 'the HUD names what the hold loaded').toContain(feedLine(label));
  expect(await foodInPlay(page), 'the release after a consumed hold does nothing').toBeNull();
});

test('the other buttons still resolve on pointerdown, exactly as before', async ({ page }) => {
  const layout = await bootTouch(page);
  await page.evaluate(() => (window as W).__warpTo('Rex'));

  const talk = layout.buttons.find((b: any) => b.id === 'talk');
  const at = await toPage(page, talk.x, talk.y);
  await page.mouse.click(at.x, at.y);

  await expect.poll(() => page.evaluate(() => (window as W).__toneMenuOpen())).toBe(true);
});

test('sliding the thumb off the button before letting go drops nothing', async ({ page }) => {
  const layout = await bootTouch(page);
  const at = await feedButton(page, layout);
  const away = await toPage(page, 320, 240); // the middle of the glass, far from the cluster

  await page.mouse.move(at.x, at.y);
  await page.mouse.down();
  await page.mouse.move(away.x, away.y, { steps: 4 });
  await page.mouse.up();

  expect(await foodInPlay(page), 'never mind is a thing a thumb can say').toBeNull();
});
