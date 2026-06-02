import { test, expect } from '@playwright/test';
import { boot } from './helpers';

type W = Record<string, unknown>;
type T = { day: number; hour: number; minute: number };

test('wall-clock time advances with real time at the default 1× rate', async ({ page }) => {
  await boot(page);

  // Fresh boot: default 1× realtime.
  expect(await page.evaluate(() => ((window as W).__clockScale as () => number)())).toBe(1);

  // Read + advance in one evaluate so the live pump can't interleave a tick.
  // At 1×, 60s of real time = +1 in-game minute.
  const delta = await page.evaluate(() => {
    const w = window as W;
    const before = (w.__clockNow as () => T)();
    const after = (w.__advanceWall as (ms: number) => T)(60_000);
    const a = (t: T) => (t.day - 1) * 1440 + t.hour * 60 + t.minute;
    return a(after) - a(before);
  });
  expect(delta).toBe(1);
});

test('T toggles the scale knob to 60× and the clock HUD shows it', async ({ page }) => {
  await boot(page);

  await page.locator('canvas').focus();
  await page.keyboard.press('KeyT');
  await page.waitForFunction(() => ((window as W).__clockScale as () => number)() === 60, undefined, {
    timeout: 5_000,
  });

  // The canvas-rendered clock HUD reflects the active multiplier.
  const hud = await page.evaluate(() => ((window as W).__clockHudText as () => string)());
  expect(hud).toContain('60×');

  // At 60×, 60s of real time = +60 in-game minutes. Single evaluate so the live
  // pump doesn't add a stray minute between reading before and advancing.
  const delta = await page.evaluate(() => {
    const w = window as W;
    const before = (w.__clockNow as () => T)();
    const after = (w.__advanceWall as (ms: number) => T)(60_000);
    const a = (t: T) => (t.day - 1) * 1440 + t.hour * 60 + t.minute;
    return a(after) - a(before);
  });
  expect(delta).toBe(60);
});
