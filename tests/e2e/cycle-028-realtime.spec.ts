import { test, expect } from '@playwright/test';
import { boot } from './helpers';

type W = Record<string, unknown>;
type T = { day: number; hour: number; minute: number };

test('wall-clock time advances at the default 60× watching rate (BACKLOG-493)', async ({ page }) => {
  await boot(page);

  // Fresh boot: 60× — a 24-minute in-game day, so a day boundary is something a player can sit and watch.
  expect(await page.evaluate(() => ((window as W).__clockScale as () => number)())).toBe(60);

  // Read + advance in one evaluate so the live pump can't interleave a tick.
  // At 60×, 60s of real time = +60 in-game minutes.
  const delta = await page.evaluate(() => {
    const w = window as W;
    const before = (w.__clockNow as () => T)();
    const after = (w.__advanceWall as (ms: number) => T)(60_000);
    const a = (t: T) => (t.day - 1) * 1440 + t.hour * 60 + t.minute;
    return a(after) - a(before);
  });
  expect(delta).toBe(60);
});

test('T toggles the scale knob down to the 1× fishbowl and the clock HUD shows it', async ({ page }) => {
  await boot(page);

  await page.locator('canvas').focus();
  await page.keyboard.press('KeyT');
  await page.waitForFunction(() => ((window as W).__clockScale as () => number)() === 1, undefined, {
    timeout: 5_000,
  });

  // The canvas-rendered clock HUD reflects the active multiplier.
  const hud = await page.evaluate(() => ((window as W).__clockHudText as () => string)());
  expect(hud).toContain('1×');

  // At 1×, 60s of real time = +1 in-game minute. Single evaluate so the live
  // pump doesn't add a stray minute between reading before and advancing.
  const delta = await page.evaluate(() => {
    const w = window as W;
    const before = (w.__clockNow as () => T)();
    const after = (w.__advanceWall as (ms: number) => T)(60_000);
    const a = (t: T) => (t.day - 1) * 1440 + t.hour * 60 + t.minute;
    return a(after) - a(before);
  });
  expect(delta).toBe(1);
});
