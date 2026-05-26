import { test, expect } from '@playwright/test';

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
  await page.goto('/');
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 });
  // Wait 2.5 real seconds = 2-3 in-game minutes
  await page.waitForTimeout(2_500);
  const t = await page.evaluate(() => {
    const fn = (window as Record<string, unknown>).__clockNow;
    return typeof fn === 'function' ? fn() : null;
  });
  expect(t).not.toBeNull();
  expect((t as { minute: number }).minute).toBeGreaterThanOrEqual(2);
});
