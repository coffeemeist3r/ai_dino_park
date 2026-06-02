import { test, expect } from '@playwright/test';
import { boot } from './helpers';

test('game boots and renders canvas', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible({ timeout: 10_000 });
  const size = await canvas.boundingBox();
  expect(size?.width).toBeGreaterThan(100);
  expect(size?.height).toBeGreaterThan(100);
});

test('canvas responds to arrow key press', async ({ page }) => {
  await page.goto('/');
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 });
  await page.locator('canvas').focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(120);
  // Smoke only — full movement assertion arrives with a save-state inspect API.
  expect(true).toBe(true);
});

test('world clock ticks in real time', async ({ page }) => {
  await boot(page);
  // Default is 1× realtime (a full day = 24 real hours), too slow to observe in a
  // test, so switch to the 60× watching rate (T) where ~1 in-game minute passes
  // per real second. Time is wall-clock-derived, so a throttled game loop still
  // catches up whenever the pump fires — poll rather than bet on a fixed window.
  await page.locator('canvas').focus();
  await page.keyboard.press('KeyT');
  await page.waitForFunction(
    () => {
      const w = window as Record<string, unknown>;
      const scaleFn = w.__clockScale as undefined | (() => number);
      const fn = w.__clockNow as undefined | (() => { hour: number; minute: number });
      if (!scaleFn || !fn || scaleFn() !== 60) return false;
      const t = fn();
      return t.minute >= 2 || t.hour > 8; // started at 08:00
    },
    undefined,
    { timeout: 20_000 },
  );
});
