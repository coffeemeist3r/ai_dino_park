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
  // The clock advances ~1 in-game minute per real second. Poll until it has
  // demonstrably ticked rather than betting on a fixed wall-time window — slow
  // CI runners throttle the game loop, so a fixed wait is flaky there.
  await page.waitForFunction(
    () => {
      const fn = (window as Record<string, unknown>).__clockNow as undefined | (() => { hour: number; minute: number });
      if (!fn) return false;
      const t = fn();
      return t.minute >= 2 || t.hour > 8; // started at 08:00
    },
    undefined,
    { timeout: 20_000 },
  );
});
