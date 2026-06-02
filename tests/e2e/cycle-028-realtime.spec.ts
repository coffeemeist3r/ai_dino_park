import { test, expect } from '@playwright/test';
import { boot } from './helpers';

type W = Record<string, unknown>;
type T = { day: number; hour: number; minute: number };

test('wall-clock time advances with real time and respects the scale', async ({ page }) => {
  await boot(page);

  // Fresh boot: default 1× realtime.
  expect(await page.evaluate(() => ((window as W).__clockScale as () => number)())).toBe(1);
  const start = await page.evaluate(() => ((window as W).__clockNow as () => T)());

  // At 1×, 60s of real time = +1 in-game minute.
  const after1x = await page.evaluate(() => ((window as W).__advanceWall as (ms: number) => T)(60_000));
  expect(after1x.minute).toBe((start.minute + 1) % 60);
});

test('T toggles the scale knob to 60× and the clock HUD shows it', async ({ page }) => {
  await boot(page);

  await page.locator('canvas').focus();
  await page.keyboard.press('KeyT');
  await page.waitForTimeout(60);

  expect(await page.evaluate(() => ((window as W).__clockScale as () => number)())).toBe(60);

  // The canvas-rendered clock HUD reflects the active multiplier.
  const hud = await page.evaluate(() => ((window as W).__clockHudText as () => string)());
  expect(hud).toContain('60×');

  // At 60×, 60s of real time = +60 in-game minutes (one hour).
  const before = await page.evaluate(() => ((window as W).__clockNow as () => T)());
  const after = await page.evaluate(() => ((window as W).__advanceWall as (ms: number) => T)(60_000));
  const beforeAbs = before.hour * 60 + before.minute;
  const afterAbs = after.hour * 60 + after.minute + (after.day - before.day) * 1440;
  expect(afterAbs - beforeAbs).toBe(60);
});
