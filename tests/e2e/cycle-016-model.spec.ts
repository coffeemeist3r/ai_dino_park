import { test, expect } from '@playwright/test';

test('the device probe resolves a known model tier', async ({ page }) => {
  await page.goto('/');
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 });
  const info = await page.evaluate(() =>
    ((window as Record<string, unknown>).__modelInfo as () => Promise<{ tier: string; id: string }>)(),
  );
  expect(['tiny', 'small', 'medium']).toContain(info.tier);
  expect(typeof info.id).toBe('string');
});
