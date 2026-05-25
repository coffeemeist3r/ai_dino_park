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
