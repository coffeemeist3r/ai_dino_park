import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Audio spine (BACKLOG-191). Hooks record INTENT at the call site, so nothing
 * here depends on actual playback (headless contexts may stay suspended) —
 * the synthesis math is pinned by unit tests; this proves the seams fire.
 */

type W = Window & Record<string, any>;

test('no AudioContext before the first gesture; one appears after (boot is clean)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await boot(page); // goto + waits only — no synthetic input
  expect(await page.evaluate(() => (window as W).__audioState())).toBe('none');

  await page.locator('canvas').focus();
  await page.keyboard.press('ArrowRight'); // any gesture lands on markActive → unlockAudio
  await expect
    .poll(() => page.evaluate(() => (window as W).__audioState()))
    .not.toBe('none');
  expect(errors).toEqual([]);
});

test('a greeted dino answers in its own voice', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__warpTo('Rex'));
  await page.locator('canvas').focus();
  await page.keyboard.press('KeyE'); // tone menu opens
  await page.keyboard.press('Digit1'); // warm — reply resolves async
  await expect
    .poll(() => page.evaluate(() => (window as W).__lastSound()))
    .toMatchObject({ kind: 'chirp', name: 'Rex' });
  const sound = await page.evaluate(() => (window as W).__lastSound());
  expect(sound.params.pitchHz).toBeGreaterThanOrEqual(120);
  expect(sound.params.pitchHz).toBeLessThanOrEqual(900);
});

test('a dino↔dino conversation chirps in the speaker’s voice', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__forceConverse());
  await expect
    .poll(() => page.evaluate(() => (window as W).__lastSound()))
    .toMatchObject({ kind: 'chirp' });
  const sound = await page.evaluate(() => (window as W).__lastSound());
  expect(typeof sound.name).toBe('string');
});

test('rapping the glass thunks', async ({ page }) => {
  await boot(page);
  const box = (await page.locator('canvas').boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 3);
  expect(await page.evaluate(() => (window as W).__lastSound())).toMatchObject({ kind: 'thunk' });
});

test('M mutes, persists across reload, and unmutes', async ({ page }) => {
  await boot(page);
  await page.locator('canvas').focus();
  await page.keyboard.press('KeyM');
  expect(await page.evaluate(() => (window as W).__soundMuted())).toBe(true);

  // Muted: a greet records no sound intent.
  await page.evaluate(() => (window as W).__warpTo('Rex'));
  await page.keyboard.press('KeyE');
  await page.keyboard.press('Digit1');
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => (window as W).__lastSound())).toBe(null);

  // The choice is a device setting: it survives a relaunch.
  expect(await page.evaluate(() => localStorage.getItem('dino.sound'))).toBe('off');
  await boot(page);
  expect(await page.evaluate(() => (window as W).__soundMuted())).toBe(true);

  await page.locator('canvas').focus();
  await page.keyboard.press('KeyM');
  expect(await page.evaluate(() => (window as W).__soundMuted())).toBe(false);
});
