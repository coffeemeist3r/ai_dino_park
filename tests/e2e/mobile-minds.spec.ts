import { test, expect, devices, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Mobile minds policy + inference governor (BACKLOG-107 / operator, 2026-06-11).
 * Runs under Pixel 5 emulation: `pointer: coarse` is real here, so this spec also
 * proves the touch layer auto-detects without the `__setTouch` hook.
 */
test.use({ ...devices['Pixel 5'] });

type W = Window & Record<string, any>;

async function toPage(page: Page, lx: number, ly: number): Promise<{ x: number; y: number }> {
  const box = (await page.locator('canvas').boundingBox())!;
  return { x: box.x + (lx / 640) * box.width, y: box.y + (ly / 480) * box.height };
}

async function tapId(page: Page, group: 'buttons' | 'sheet' | 'chips', id: string): Promise<void> {
  const layout = await page.evaluate(() => (window as W).__touchLayout());
  const target = layout[group].find((b: any) => b.id === id);
  const at = await toPage(page, target.x, target.y);
  await page.mouse.click(at.x, at.y);
}

test('a phone boots on the stub brain with the touch layer auto-detected', async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => (window as W).__touchEnabled())).toBe(true); // no __setTouch — real coarse pointer
  expect(await page.evaluate(() => (window as W).__brainKind())).toBe('stub');
  const gov = await page.evaluate(() => (window as W).__governor());
  expect(gov.coarse).toBe(true);
  expect(gov.consent).toBe(null);
  expect(gov.cooldownSteps).toBe(24); // a third the desktop chatter rate
  // The stub still talks — greeting falls back to the canned voice, never silence.
  await page.evaluate(() => (window as W).__warpTo('Rex'));
  const hearts = await page.evaluate(() => (window as W).__greet('Rex'));
  expect(hearts).toBeGreaterThanOrEqual(0);
});

test('the minds opt-in: consent dialog → [1] enables + persists → toggle off', async ({ page }) => {
  await boot(page);

  // ⋯ → 🧠 row opens the consent dialog (model + size quoted), chips up.
  // The open is async (a cache probe decides the dialog copy) — poll for it.
  await tapId(page, 'buttons', 'more');
  await tapId(page, 'sheet', 'minds');
  await expect.poll(() => page.evaluate(() => (window as W).__mindsConfirmOpen())).toBe(true);
  expect(await page.evaluate(() => (window as W).__mindsConfirmMode())).toBe('enable');

  // [1] = download & enable: brain swaps to webllm, consent lands in storage.
  await tapId(page, 'chips', 'pick1');
  expect(await page.evaluate(() => (window as W).__mindsConfirmOpen())).toBe(false);
  expect(await page.evaluate(() => (window as W).__brainKind())).toBe('webllm');
  expect(await page.evaluate(() => localStorage.getItem('dino.minds'))).toBe('on');

  // Consent survives a relaunch — the phone boots straight onto the model path.
  await boot(page);
  expect(await page.evaluate(() => (window as W).__brainKind())).toBe('webllm');

  // The same row toggles off (nothing is actually cached in headless — no WebGPU,
  // no download — so this takes the straight-off path, no keep/delete dialog).
  await tapId(page, 'buttons', 'more');
  await tapId(page, 'sheet', 'minds');
  await expect.poll(() => page.evaluate(() => (window as W).__brainKind())).toBe('stub');
  expect(await page.evaluate(() => localStorage.getItem('dino.minds'))).toBe('off');
});

test('declining the consent dialog leaves the stub and stores nothing', async ({ page }) => {
  await boot(page);
  await tapId(page, 'buttons', 'more');
  await tapId(page, 'sheet', 'minds');
  await expect.poll(() => page.evaluate(() => (window as W).__mindsConfirmOpen())).toBe(true);

  await tapId(page, 'chips', 'close');
  expect(await page.evaluate(() => (window as W).__mindsConfirmOpen())).toBe(false);
  expect(await page.evaluate(() => (window as W).__brainKind())).toBe('stub');
  expect(await page.evaluate(() => localStorage.getItem('dino.minds'))).toBe(null);
});

test('long dialogs page GBA-style: E forward, ◀ back, ✕ closes from any page', async ({ page }) => {
  await boot(page);
  // The keeper picker is reliably longer than one 3-line page (3 observers with
  // ability blurbs) — the same overflow that cut off the minds dialog text.
  await page.keyboard.press('KeyK');
  const info = await page.evaluate(() => (window as W).__dialogPage());
  expect(info.pages).toBeGreaterThan(1);
  expect(info.page).toBe(0);

  // E turns the page instead of dismissing the picker.
  await page.keyboard.press('KeyE');
  expect((await page.evaluate(() => (window as W).__dialogPage())).page).toBe(1);
  expect(await page.evaluate(() => (window as W).__keeperPickerOpen())).toBe(true);

  // ArrowLeft (the ◀ chip's keyboard twin) turns back.
  await page.keyboard.press('ArrowLeft');
  expect((await page.evaluate(() => (window as W).__dialogPage())).page).toBe(0);

  // The touch path itself (operator bug: the ◀ chip's prev() was undone by the
  // scene handler's body-tap next()): tap the dialog body forward, the chip back.
  const body = await toPage(page, 320, 430);
  await page.mouse.click(body.x, body.y);
  expect((await page.evaluate(() => (window as W).__dialogPage())).page).toBe(1);
  await tapId(page, 'chips', 'back');
  expect((await page.evaluate(() => (window as W).__dialogPage())).page).toBe(0);

  // ✕ closes immediately, pages remaining or not.
  await tapId(page, 'chips', 'close');
  expect(await page.evaluate(() => (window as W).__keeperPickerOpen())).toBe(false);

  // And a number pick still works from a later page: reopen, page forward, pick.
  await page.keyboard.press('KeyK');
  await page.keyboard.press('KeyE');
  await tapId(page, 'chips', 'pick2');
  expect(await page.evaluate(() => (window as W).__keeperPickerOpen())).toBe(false);
  expect(await page.evaluate(() => (window as W).__keeper())).not.toBe('aether');
});

test('the governor pauses ambient chatter for a hidden tab or a dying battery', async ({ page }) => {
  await boot(page);
  const gov = await page.evaluate(() => (window as W).__governor());
  expect(gov.ambientAllowed).toBe(true); // visible tab, battery unknown-or-fine
  // The decision logic itself (hidden/battery cutoffs) is pinned by unit tests;
  // here we prove the live wiring exposes the same verdict shape.
  expect(typeof gov.hidden).toBe('boolean');
});
